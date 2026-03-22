'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Lock, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  tag: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [disabledProducts, setDisabledProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/products?admin=true');
      const data = await response.json();
      
      if (data.success) {
        // 验证密码通过fetch
        const verifyResponse = await fetch(`/api/admin/toggle?password=${password}`);
        const verifyData = await verifyResponse.json();
        
        if (verifyData.success) {
          setIsLoggedIn(true);
          setProducts(data.data);
          setDisabledProducts(verifyData.disabledProducts || []);
        } else {
          alert('密碼錯誤');
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      alert('登錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?admin=true');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        setDisabledProducts(data.disabledProducts || []);
      }
    } catch (error) {
      console.error('获取产品失败:', error);
    }
  };

  const toggleProduct = async (productId: string, currentlyDisabled: boolean) => {
    try {
      const response = await fetch('/api/admin/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: '1994',
          productId,
          disabled: !currentlyDisabled
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setDisabledProducts(data.disabledProducts);
      }
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '1994' })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('數據已刷新');
        fetchProducts();
      }
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return `HKD ${price.toLocaleString()}`;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">管理員後台</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">請輸入管理員密碼</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="輸入密碼"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white pr-12"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg transition-colors font-semibold"
            >
              {loading ? '驗證中...' : '登入'}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">管理員後台</h1>
                <p className="text-xs text-gray-400">產品管理</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {products.length} 款產品
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 transition-colors"
                title="刷新數據"
              >
                <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="搜索產品..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
            />
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{products.length}</p>
            <p className="text-xs text-gray-400">總產品</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{disabledProducts.length}</p>
            <p className="text-xs text-gray-400">已下架</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{products.length - disabledProducts.length}</p>
            <p className="text-xs text-gray-400">上架中</p>
          </div>
        </div>
      </div>

      {/* Product List */}
      <main className="container mx-auto px-4 py-4">
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const isDisabled = disabledProducts.includes(product.id);
            const hasStock = product.stock > 0;
            
            return (
              <div
                key={product.id}
                className={`rounded-lg p-4 border transition-all ${
                  isDisabled 
                    ? 'bg-red-900/20 border-red-800' 
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white truncate">
                        {product.name}
                      </h3>
                      {isDisabled && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">
                          已下架
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">{product.category}</p>
                      <p className="text-xs text-gray-400">
                        批發價 {formatPrice(product.wholesalePrice)}
                      </p>
                      <p className={`text-xs ${hasStock ? 'text-green-400' : 'text-red-400'}`}>
                        庫存: {product.stock}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleProduct(product.id, isDisabled)}
                    className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-w-[60px] ${
                      isDisabled
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isDisabled ? '上架' : '下架'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
