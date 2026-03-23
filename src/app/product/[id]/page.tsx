'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Sparkles, Ban, X, Eye, EyeOff, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  retailPrice: number;
  salePrice: number;
  tag: string;
  description: string;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionGenerated, setDescriptionGenerated] = useState(false);
  const [canRegenerate, setCanRegenerate] = useState(false);
  
  // 下架相关状态
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // 留言相關狀態
  const [comments, setComments] = useState<{name: string; content: string; createdAt: string}[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');

  // 產品圖片狀態
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  // 當產品加載完成後，獲取留言
  useEffect(() => {
    if (product && product.id) {
      fetchComments();
      fetchProductImages(product.id);
    }
  }, [product]);

  // 獲取產品圖片
  const fetchProductImages = async (productId: string) => {
    setImagesLoading(true);
    try {
      // 從靜態資料夾讀取圖片
      // 假設圖片放在 /images/products/{id}/ 目錄
      const response = await fetch(`/images/products/${productId}/`);
      const html = await response.text();
      
      // 解析 HTML 找到所有圖片檔案
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const imagePaths: string[] = [];
      
      // 用正則表達式從 HTML 中提取圖片路徑
      const imgMatches = html.match(/["']([^"']*\.(jpg|jpeg|png|webp|gif)["']/gi) || [];
      for (const match of imgMatches) {
        const path = match.replace(/["']/g, '');
        if (path.includes(`/products/${productId}/`)) {
          imagePaths.push(path);
        }
      }
      
      // 清理路徑並去除重複
      const cleanPaths = [...new Set(imagePaths)].filter(Boolean);
      setProductImages(cleanPaths);
    } catch (error) {
      console.error('獲取產品圖片失敗:', error);
      setProductImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  // 上一張/下一張圖片
  const prevImage = () => setSelectedImageIndex(prev => (prev - 1 + productImages.length) % productImages.length);
  const nextImage = () => setSelectedImageIndex(prev => (prev + 1) % productImages.length);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}?admin=true`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
        setIsDisabled(data.isDisabled || false);
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 獲取留言
  const fetchComments = async () => {
    if (!product) return;
    try {
      setCommentsLoading(true);
      const response = await fetch(`/api/comments?productId=${product.id}`);
      const data = await response.json();
      if (data.success) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('獲取留言失敗:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 發布留言
  const submitComment = async () => {
    if (!product || !newCommentName.trim() || !newCommentContent.trim()) return;
    
    try {
      setSubmittingComment(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: newCommentName.trim(),
          content: newCommentContent.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setComments([data.data, ...comments]);
        setNewCommentName('');
        setNewCommentContent('');
      }
    } catch (error) {
      console.error('發布留言失敗:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 刪除留言
  const deleteComment = async (index: number) => {
    if (!product) return;
    
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          index: index
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // 從本地狀態中移除該留言
        const newComments = [...comments];
        newComments.splice(index, 1);
        setComments(newComments);
      }
    } catch (error) {
      console.error('刪除留言失敗:', error);
    }
  };

  const generateDescription = async () => {
    if (!product || descriptionLoading) return;
    
    try {
      setDescriptionLoading(true);
      console.log('开始生成产品介绍:', { name: product.name, category: product.category });
      
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: product.name, 
          category: product.category 
        })
      });
      
      const data = await response.json();
      console.log('生成结果:', data);
      
      if (data.success) {
        setProduct({ ...product, description: data.description });
        setDescriptionGenerated(true);
        setCanRegenerate(true);  // 啟用重新生成
      } else {
        console.error('生成失败:', data.error);
      }
    } catch (error) {
      console.error('生成产品介绍失败:', error);
    } finally {
      setDescriptionLoading(false);
    }
  };

  const handleDisableProduct = async () => {
    if (!product || disableLoading) return;
    
    if (!disablePassword) {
      alert('請輸入密碼');
      return;
    }
    
    setDisableLoading(true);
    
    try {
      const response = await fetch('/api/admin/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: disablePassword,
          productId: product.id,
          disabled: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowDisableDialog(false);
        setDisablePassword('');
        setIsDisabled(true);
        alert('產品已下架');
      } else {
        alert(data.error || '密碼錯誤');
      }
    } catch (error) {
      console.error('下架失败:', error);
      alert('下架失敗');
    } finally {
      setDisableLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `HKD ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">產品未找到</p>
          <Link href="/" className="text-amber-600 dark:text-amber-400 underline">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-amber-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <span>← 返回列表</span>
            </button>
            
            {/* 下架按钮 */}
            {isDisabled ? (
              <span className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg">
                已下架
              </span>
            ) : (
              <button
                onClick={() => setShowDisableDialog(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-sm rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
                下架產品
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Product Info */}
        <div className="space-y-6">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                品牌：{product.category}
              </p>
            </div>

            {/* Price Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-amber-200 dark:border-gray-700">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">零售價</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {formatPrice(product.retailPrice)}
                  </p>
                </div>
                
                <div className="border-t border-amber-100 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">批發價</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {formatPrice(product.wholesalePrice)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    * 批發價需符合最低訂購量要求
                  </p>
                </div>
              </div>
            </div>

            {/* 產品圖片展示 */}
            {productImages.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-gray-700 overflow-hidden">
                {/* 圖片畫廊 */}
                <div className="relative">
                  {/* 主圖 */}
                  <div 
                    className="relative aspect-square bg-gray-100 dark:bg-gray-700 cursor-pointer"
                    onClick={() => setShowLightbox(true)}
                  >
                    <img
                      src={productImages[selectedImageIndex]}
                      alt={`${product.name} - 圖片 ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* 縮略圖列表 */}
                  {productImages.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {productImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex 
                              ? 'border-amber-500 ring-2 ring-amber-200' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`縮略圖 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-amber-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">產品介紹</h2>
                <div className="flex gap-2">
                  {canRegenerate && (
                    <button
                      onClick={generateDescription}
                      disabled={descriptionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {descriptionLoading ? '生成中...' : '重新生成'}
                    </button>
                  )}
                  {!descriptionGenerated && (
                    <button
                      onClick={generateDescription}
                      disabled={descriptionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm rounded-lg transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {descriptionLoading ? '生成中...' : '點擊生成'}
                    </button>
                  )}
                </div>
              </div>
              
              {descriptionLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              ) : descriptionGenerated ? (
                <div className="space-y-2 text-sm">
                  {product.description.split('\n').map((line, index) => {
                    const [label, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim();
                    if (!value) return null;
                    return (
                      <div key={index} className="flex">
                        <span className="text-gray-500 dark:text-gray-400 min-w-[80px]">{label}:</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center py-4">
                  點擊上方按鈕，AI 將為您生成產品介紹
                </p>
              )}
            </div>

            {/* 留言區域 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-amber-200 dark:border-gray-700 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">討論區</h2>
              
              {/* 發布留言表單 */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="您的暱稱"
                    value={newCommentName}
                    onChange={(e) => setNewCommentName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    placeholder="分享您的想法..."
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
                <button
                  onClick={submitComment}
                  disabled={submittingComment || !newCommentName.trim() || !newCommentContent.trim()}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {submittingComment ? '發布中...' : '發布留言'}
                </button>
              </div>
              
              {/* 留言列表 */}
              {commentsLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-amber-600/20 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                            {comment.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{comment.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm pl-10">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center py-4">尚無留言，歡迎發表第一條留言！</p>
              )}
            </div>
          </div>

        </main>

      {/* 下架密码对话框 */}
      {showDisableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">下架產品</h3>
              <button
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisablePassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              請輸入管理員密碼以確認下架此產品
            </p>
            <div className="relative mb-4">
              <input
                type={showDisablePassword ? 'text' : 'password'}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDisableProduct()}
                placeholder="請輸入密碼"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowDisablePassword(!showDisablePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleDisableProduct}
              disabled={disableLoading}
              className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
            >
              {disableLoading ? '處理中...' : '確認下架'}
            </button>
          </div>
        </div>
      )}

      {/* 圖片 Lightbox（全屏查看） */}
      {showLightbox && productImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* 上一張 */}
          {productImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          {/* 主圖 */}
          <img
            src={productImages[selectedImageIndex]}
            alt={`${product.name} - 圖片 ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* 下一張 */}
          {productImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          
          {/* 計數器 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {productImages.length}
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
