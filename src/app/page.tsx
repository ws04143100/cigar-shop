'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, RefreshCw, ShoppingCart, Plus, Minus, Trash2, Copy, Check, X, Upload } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  salePrice: number;
  tag: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface BrandStats {
  [key: string]: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brandStats, setBrandStats] = useState<BrandStats>({});
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // 刷新相关状态
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 购物车相关状态
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [cartText, setCartText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedBrand) {
      filtered = filtered.filter(p => p.category === selectedBrand);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedBrand, products]);

  const fetchProducts = async (brand?: string) => {
    try {
      setLoading(true);
      const url = brand ? `/api/products?brand=${encodeURIComponent(brand)}` : '/api/products';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setProducts(data.data);
        setFilteredProducts(data.data);
        if (data.brandStats) {
          setBrandStats(data.brandStats);
        }
      }
    } catch (error) {
      console.error('获取产品数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!password) {
      setPasswordError('請輸入密碼');
      return;
    }
    
    setRefreshing(true);
    setPasswordError('');
    
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowPasswordDialog(false);
        setPassword('');
        fetchProducts(selectedBrand);
      } else {
        setPasswordError(data.error || '密碼錯誤');
      }
    } catch (error) {
      setPasswordError('刷新失敗');
    } finally {
      setRefreshing(false);
    }
  };

  // 上传Excel
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!password) {
      setPasswordError('請輸入密碼');
      setShowPasswordDialog(true);
      e.target.value = '';
      return;
    }
    
    setUploading(true);
    setPasswordError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowPasswordDialog(false);
        setPassword('');
        fetchProducts(selectedBrand);
        alert(`批發表已更新：${data.fileName}`);
      } else {
        setPasswordError(data.error || '上傳失敗');
        setShowPasswordDialog(true);
      }
    } catch (error) {
      setPasswordError('上傳失敗');
      setShowPasswordDialog(true);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 购物车操作
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.wholesalePrice * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 生成购物车文案
  const generateCartText = useCallback(() => {
    const today = new Date();
    const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    let text = `${dateStr}\n`;
    cart.forEach(item => {
      text += `${item.name} ${item.quantity} ${item.wholesalePrice}\n`;
    });
    text += `總價HKD ${cartTotal.toLocaleString()}`;
    
    setCartText(text);
  }, [cart, cartTotal]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cartText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert('將此訊息發給客服建立訂單');
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, [cartText]);

  const formatPrice = (price: number) => {
    return `HKD ${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-amber-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 上传按钮 */}
              <label className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer" title="上傳Excel批發表">
                <Upload className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${uploading ? 'animate-pulse' : ''}`} />
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {/* 刷新按钮 */}
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="刷新數據"
              >
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              
              {/* 购物车按钮 */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="搜索雪茄名稱或品牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-amber-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
          </div>

          {/* Brand Filter - 3 rows max */}
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            <button
              onClick={() => setSelectedBrand('')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedBrand === '' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              }`}
            >
              全部
            </button>
            {Object.entries(brandStats)
              .sort((a, b) => b[1] - a[1])
              .map(([brand, count]) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedBrand === brand 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}
                >
                  {brand} ({count})
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                    </div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              {searchTerm ? '未找到匹配的產品' : '暫無產品數據'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const inCart = cart.find(item => item.id === product.id);
              return (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/product/${product.id}`}
                      className="flex-1 min-w-0"
                    >
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate hover:text-amber-600 dark:hover:text-amber-400">
                        {product.name}
                      </h3>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {product.category}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/product/${product.id}`}
                        className="text-right"
                      >
                        <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                          {formatPrice(product.retailPrice)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          批發 {formatPrice(product.wholesalePrice)}
                        </p>
                      </Link>
                      {/* 加入购物车按钮 */}
                      {inCart ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center hover:bg-amber-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 密码对话框 */}
      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">請輸入密碼</h3>
              <button
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
              placeholder="請輸入刷新密碼"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white mb-2"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm mb-2">{passwordError}</p>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg transition-colors"
            >
              {refreshing ? '刷新中...' : '確認刷新'}
            </button>
          </div>
        </div>
      )}

      {/* 购物车抽屉 */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCart(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">購物車</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">購物車是空的</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">批發價 {formatPrice(item.wholesalePrice)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600 dark:text-gray-400">總計（批發價）</span>
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        HKD {cartTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <button
                      onClick={generateCartText}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors mb-3"
                    >
                      生成訂單文案
                    </button>
                    
                    {cartText && (
                      <div className="mb-3">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 whitespace-pre-line text-sm mb-3">
                          {cartText}
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="w-5 h-5" />
                              已複製
                            </>
                          ) : (
                            <>
                              <Copy className="w-5 h-5" />
                              一鍵複製
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-amber-200 dark:border-gray-700 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2025 雪茄精品館 - 專業雪茄零售批發
          </p>
        </div>
      </footer>
    </div>
  );
}
