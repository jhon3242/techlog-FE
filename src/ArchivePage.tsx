import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  BookMarked,
  ThumbsUp,
  Eye,
  PlusCircle,
  ArrowUp,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL } from "./utils/apiConfig";
import { RecommendModal } from "./components/RecommendModal";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { blogTypeLogos, blogTypeColors } from "./constants/blogTypes";
import { BlogPost, PostersResponse, PosterSearchRequest } from "./types/blog";

const blogTypeNames: Record<string, string> = {
  'WOOWABRO': '우아한형제들',
  'NAVER': '네이버',
  'LINE': '라인',
  'KAKAO_PAY': '카카오페이',
  'KAKAO': '카카오',
  'COUPANG': '쿠팡',
  'TOSS': '토스',
  'DDANGN': '딩근'
};

// 배경색에 따른 글자색 결정 함수
const getTextColor = (backgroundColor: string): string => {
  // HEX 색상을 RGB로 변환
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 밝기 계산 (YIQ 공식)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // 밝기가 128보다 크면 어두운 글자색, 작으면 흰색 반환
  return yiq >= 128 ? '#1F2937' : '#FFFFFF';
};

function App() {
  // Device ID 생성 및 저장
  const deviceId = useMemo(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('deviceId', id);
    }
    return id;
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlogType, setSelectedBlogType] = useState<string>("");
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleRecommendClick = () => {
    setIsRecommendModalOpen(true);
  };

  const handleRecommendSubmit = async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '추천 등록 실패');
      }

      // 성공 시 메시지 표시
      setSuccessMessage('추천해주셔서 감사합니다!');
      setTimeout(() => {
        setSuccessMessage('');
        setIsRecommendModalOpen(false);
      }, 2000);
    } catch (error) {
      console.error('추천 등록 실패:', error);
      if (error instanceof Error) {
        setSuccessMessage(`추천 등록 실패: ${error.message}`);
      } else {
        setSuccessMessage('추천 등록 실패');
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  const handleRecommendClose = () => {
    setIsRecommendModalOpen(false);
  };
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const size = 10;

  useEffect(() => {
    const storedDeviceId = localStorage.getItem("deviceId");
    if (!storedDeviceId) {
      const newDeviceId = uuidv4();
      localStorage.setItem("deviceId", newDeviceId);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/tags`)
      .then(res => res.json())
      .then((tags: {id: number, name: string}[]) => setAvailableTags(tags.map(t => t.name)))
      .catch(() => setAvailableTags([]));
  }, []);

  useEffect(() => {
    fetchPosts(null).then(() => {
      setIsInitialLoad(false);
    });
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSearch = () => {
    setPosts([]);
    setNextCursor(null);
    setHasMore(true);
    fetchPosts(null);
  };

  // 검색 조건이 모두 비어있을 때 자동으로 전체 조회
  useEffect(() => {
    if (!searchQuery.trim() && !selectedBlogType && selectedTags.length === 0) {
      handleSearch();
    }
  }, [searchQuery, selectedBlogType, selectedTags]);

  useEffect(() => {
    if (!observerRef.current || loadingMore) {
      console.log('Observer not initialized:', {
        hasObserverRef: !!observerRef.current,
        loadingMore
      });
      return;
    }

    console.log('Setting up intersection observer');
    const observer = new IntersectionObserver(
      async ([entry]) => {
        console.log('Intersection observer triggered:', {
          isIntersecting: entry.isIntersecting,
          nextCursor,
          loadingMore
        });

        if (entry.isIntersecting && nextCursor !== null) {
          try {
            setLoadingMore(true);
            const success = await fetchPosts(nextCursor);
            if (!success) {
              console.error('Failed to fetch more posts');
              setTimeout(() => {
                setLoadError(false);
              }, 3000);
            }
          } catch (error) {
            console.error('Error in intersection observer:', error);
            setLoadError(true);
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { 
        threshold: 0.5,
        rootMargin: '200px'
      }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore]);

  const fetchPosts = async (cursor: string | null): Promise<boolean> => {
    try {
      // hasNext가 false이고 cursor가 null이 아닌 경우 (추가 로딩 시도) 요청을 보내지 않음
      if (!hasMore && cursor !== null) {
        return false;
      }

      if (cursor === null) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('keyword', searchQuery.trim());
      if (selectedBlogType) params.append('blogType', selectedBlogType);
      if (selectedTags.length > 0) selectedTags.forEach(tag => params.append('tags', tag));
      if (cursor) params.append('cursor', cursor);

      console.log('Fetching posts with params:', params.toString());
      const response = await fetch(`${API_BASE_URL}/api/posters?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PostersResponse = await response.json();
      console.log('API Response:', {
        cursor,
        nextCursor: data.nextCursor,
        hasNext: data.hasNext,
        postsCount: data.posters.length
      });
      
      const transformed = data.posters.map((post: any) => ({
        id: post.id,
        title: post.title,
        company: post.blogType || "Unknown Company",
        summary: post.content
          ? post.content.substring(0, 150) + "..."
          : "No summary available",
        imageUrl: post.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500",
        tags: post.tags || [],
        recommendations: post.recommendations || 0,
        views: post.views || 0,
        brandColor: getBrandColor(post.blogType || ''),
        content: post.content,
        url: post.url,
        blogType: post.blogType,
      }));
      
      if (cursor === null) {
        setPosts(transformed);
      } else {
        setPosts(prev => [...prev, ...transformed]);
      }
      
      // hasNext가 false면 더 이상 요청을 보내지 않음
      setHasMore(data.hasNext);
      setNextCursor(data.hasNext ? data.nextCursor?.toString() || null : null);
      setLoadError(false);

      console.log('State after update:', {
        nextCursor: data.hasNext ? data.nextCursor?.toString() || null : null,
        hasMore: data.hasNext,
        totalPosts: cursor === null ? transformed.length : posts.length + transformed.length
      });

      return true;
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (cursor === null) {
        setPosts([]);
      }
      setHasMore(false);
      setLoadError(true);
      return false;
    } finally {
      if (cursor === null) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getBrandColor = (blogType: string) => {
    return blogTypeColors[blogType] || '#E5E7EB';
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);
    const viewedKey = `viewed_${post.id}`;
    if (localStorage.getItem(viewedKey) !== '1') {
      fetch(`${API_BASE_URL}/api/posters/${post.id}/view`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
      }).catch(console.error);
      setPosts(prevPosts => prevPosts.map(p =>
        p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p
      ));
      setSelectedPost(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
      localStorage.setItem(viewedKey, '1');
    }
  };

  const handleRecommend = async (postId: number) => {
    const recommendedKey = `recommended_${postId}`;
    const isRecommended = localStorage.getItem(recommendedKey) === '1';
    
    try {
      await fetch(`${API_BASE_URL}/api/posters/${postId}/recommend`, {
        method: isRecommended ? "DELETE" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId,
        },
      });
      
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, recommendations: (p.recommendations || 0) + (isRecommended ? -1 : 1) }
            : p
        )
      );
      
      if (selectedPost?.id === postId) {
        setSelectedPost({
          ...selectedPost,
          recommendations: (selectedPost.recommendations || 0) + (isRecommended ? -1 : 1),
        });
      }
      
      localStorage.setItem(recommendedKey, isRecommended ? '0' : '1');
    } catch (e) {
      console.error("Failed to recommend", e);
    }
  };

  const renderSkeleton = (count = 6) =>
    Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className="flex flex-col rounded-xl overflow-hidden shadow-md bg-gray-200 animate-pulse"
      >
        <div className="h-48 bg-gray-300"></div>
        <div className="flex flex-col flex-1 p-6">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-300">
            <div className="flex items-center space-x-1">
              <div className="h-5 w-5 bg-gray-400 rounded"></div>
              <div className="h-4 w-6 bg-gray-400 rounded"></div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-5 w-5 bg-gray-400 rounded"></div>
              <div className="h-4 w-6 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ));

  const handleScrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen relative">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center">
            <a href="/" className="cursor-pointer">
              <img src="/images/logo.png" alt="TechBlogArchive Logo" className="h-12" />
            </a>
          </div>
          <motion.button
            className="flex items-center px-4 py-2 rounded-lg bg-[#F5F9FF] text-[#4C8CF7] hover:bg-[#E6F0FF]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRecommendClick}
          >
            <PlusCircle className="h-6 w-6 text-[#4C8CF7] mr-2" />
            <span className="flex items-center gap-2 text-sm text-[#4C8CF7]">
              ✨ 블로그 글 추천하기
            </span>
          </motion.button>
        </div>
      </nav>
      <RecommendModal
        isOpen={isRecommendModalOpen}
        onClose={handleRecommendClose}
        onSubmit={handleRecommendSubmit}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
      />

      <div className="pt-16 pb-8 max-w-4xl mx-auto px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-center mb-4"
        >
          Find insight. Techlog
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSearch();
                  }
                }}
                placeholder="Search by topic"
                className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-300 bg-white/80 backdrop-blur focus:ring-2 focus:ring-[#4C8CF7]"
              />
            </div>
            <select
              value={selectedBlogType}
              onChange={(e) => setSelectedBlogType(e.target.value)}
              className="py-3 px-4 rounded-xl border border-gray-300 bg-white/80 backdrop-blur focus:ring-2 focus:ring-[#4C8CF7]"
            >
              <option value="">전체 블로그</option>
              <option value="WOOWABRO">우아한형제들</option>
              <option value="NAVER">네이버</option>
              <option value="LINE">라인</option>
              <option value="KAKAO_PAY">카카오페이</option>
              <option value="KAKAO">카카오</option>
              <option value="COUPANG">쿠팡</option>
              <option value="TOSS">토스</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl bg-[#4C8CF7] text-white hover:bg-[#3A7DE8] focus:ring-2 focus:ring-[#4C8CF7]"
            >
              Search
            </button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-[#4C8CF7] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 pb-16">
        {loading
          ? renderSkeleton(6)
          : posts.map((post, index) => {
              const blogType = post.blogType || 'UNKNOWN';
              const meta = blogTypeLogos[blogType] ? {
                logo: blogTypeLogos[blogType],
                name: blogTypeNames[blogType] || blogType,
                color: blogTypeColors[blogType] || '#888'
              } : null;
              const isRecommended = localStorage.getItem(`recommended_${post.id}`) === '1';
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: isInitialLoad ? 0.5 : 0.2,
                    delay: isInitialLoad ? 0.6 + (index * 0.1) : 0
                  }}
                  className="rounded-2xl overflow-hidden shadow bg-white flex flex-col max-w-xl mx-auto border border-gray-100 mb-8 transition hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                  onClick={() => handlePostClick(post)}
                >
                  {/* 썸네일 */}
                  <div className="bg-gray-200">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title} 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  {/* 본문 */}
                  <div className="p-7 pb-5 flex flex-col flex-1 border-t border-gray-100 bg-[#F5F6FA]">
                    {/* 키워드(태그) */}
                    <div className="flex flex-wrap gap-2 mb-4 overflow-hidden">
                      {(post.tags || []).slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-4 py-1 rounded-full text-sm font-medium bg-[#D4E4FF] text-[#4C8CF7] whitespace-nowrap flex-shrink-0"
                        >
                          {tag}
                        </span>
                      ))}
                      {(post.tags || []).length > 2 && (
                        <span className="px-4 py-1 rounded-full text-sm font-medium bg-[#D4E4FF] text-[#4C8CF7] whitespace-nowrap flex-shrink-0">
                          +{(post.tags || []).length - 2}
                        </span>
                      )}
                    </div>
                    {/* 제목 */}
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{post.title}</h3>
                    {/* 본문 */}
                    <p className="text-gray-600 text-base mb-6 line-clamp-3">{post.summary}</p>
                    {/* 회사/작성자/추천/조회 */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {meta && (
                            <img
                              src={meta.logo}
                              alt={meta.name}
                              className={
                                blogType === 'NAVER'
                                  ? 'w-full h-full object-cover'
                                  : blogType === 'WOOWABRO'
                                    ? 'w-8 h-8 object-contain'
                                    : 'w-7 h-7 object-contain'
                              }
                            />
                          )}
                        </div>
                        {meta && (
                          <span
                            className="px-4 py-1 rounded-full text-sm font-semibold"
                            style={{ 
                              backgroundColor: blogTypeColors[blogType] || '#888',
                              color: getTextColor(blogTypeColors[blogType] || '#888')
                            }}
                          >
                            {meta.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-5">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRecommend(post.id);
                          }}
                          className={`focus:outline-none transition hover:bg-[#E6F0FF] hover:scale-110 rounded-full p-1 cursor-pointer ${
                            isRecommended ? 'text-[#4C8CF7]' : 'text-gray-400'
                          }`}
                          aria-label="추천하기"
                        >
                          <Heart size={20} />
                        </button>
                        <span className="text-base">{post.recommendations}</span>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Eye size={20} />
                          <span className="text-base">{post.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="col-span-full flex justify-center items-center py-8"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#4C8CF7] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">더 많은 글을 불러오는 중...</p>
            </div>
          </motion.div>
        )}
        <div 
          ref={observerRef} 
          className="h-10 w-full"
          style={{ visibility: hasMore ? 'visible' : 'hidden' }}
        />
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setSelectedPost(null);
              requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-4xl w-full rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedPost.imageUrl && (
                <div className="relative">
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="h-40 sm:h-48 md:h-56 lg:h-64 xl:h-80 w-full object-cover"
                  />
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center">
                    {selectedPost.blogType && blogTypeLogos[selectedPost.blogType] && (
                      <div className="p-1.5 sm:p-2 bg-white/90 rounded-lg shadow-sm transition-transform duration-200 hover:scale-110">
                        <img
                          src={blogTypeLogos[selectedPost.blogType]}
                          alt={`${selectedPost.blogType} logo`}
                          className={
                            selectedPost.blogType === 'NAVER'
                              ? 'w-6 h-6 sm:w-8 sm:h-8 object-cover'
                              : selectedPost.blogType === 'WOOWABRO'
                                ? 'w-5 h-5 sm:w-7 sm:h-7 object-contain'
                                : 'w-6 h-6 sm:w-8 sm:h-8 object-contain'
                          }
                        />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedPost(null);
                        requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
                      }}
                      className="p-1.5 sm:p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                  {selectedPost.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(selectedPost.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="px-4 py-1 rounded-full text-sm font-medium bg-[#D4E4FF] text-[#4C8CF7] whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
                {selectedPost.url && (
                  <div className="mt-6 sm:mt-8 text-center">
                    <a
                      href={selectedPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#4C8CF7] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#3A7DE8] text-sm sm:text-base"
                    >
                      원문 보기 🔗
                    </a>
                  </div>
                )}
                <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                  <div className="flex items-center space-x-1 text-[#4C8CF7]">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRecommend(selectedPost.id);
                      }}
                      className={`focus:outline-none transition hover:bg-[#E6F0FF] hover:scale-110 rounded-full p-1 cursor-pointer ${
                        localStorage.getItem(`recommended_${selectedPost.id}`) === '1' ? 'text-[#4C8CF7]' : 'text-gray-400'
                      }`}
                      aria-label="추천하기"
                    >
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <span className="text-sm sm:text-base">{selectedPost.recommendations}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">{selectedPost.views}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-8 right-8 bg-[#4C8CF7] text-white p-3 rounded-full hover:bg-[#3A7DE8] shadow-lg"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

const AppWithBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithBoundary;
