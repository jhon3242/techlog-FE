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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const blogTypeLogos: { [key: string]: string } = {
  WOOWABRO: "/images/woowa-icon.png",
  NAVER: "/images/naver-icon.png",
  LINE: "https://i.namu.wiki/i/4lZMO-XK7Pdyn7A84kBwZyJW_1PwsF53s8AICTYe6nGHEyKmA1tBoKU1ZEclRYRYqkcjvrdp01xpUTB76HD09yf4x597jKS5l9K8XWMoqPjfEJjee0wd8G5rxZluqyUc1nlh2zp1koxmfa9xAcTLjA.svg",
  KAKAO_PAY: "https://i.namu.wiki/i/e--EGUzVmBMZ97iEgts-8FmlaWmkHnNyFDdg47f2LYky8CGtudl4QI27F-6oXPpOqqIJTbfPUfJcUKyves2_12OQpPjP3mnpM_zYSNYgqRLHnDiU9CSTXdELMIXGpcrC0OTvfX1xUF3M1x9WTmNQNw.svg",
  KAKAO: "/images/kakao-icon.png",
  COUPANG: "https://i.namu.wiki/i/B4-c6bOz5UMSkT2XGouLqwZCLid6bdH94R4v1kBZMBHCTXBFXqWHcoqJ8CNT_TRJHDCFXCp2rHCj_XdnsLcpCmN9qiWOGqXokb-u7k8EAgnCysmkdlnV0ChaZt7UVjNk-z3WAFHDDmy700YiklzXVw.svg"
};

const blogTypeColors: { [key: string]: string } = {
  WOOWABRO: "bg-[#03C75A]",
  NAVER: "bg-[#03C75A]",
  LINE: "bg-[#00B900]",
  KAKAO_PAY: "bg-[#FFE600]",
  KAKAO: "bg-[#FFE600]",
  COUPANG: "bg-[#FF4E50]"
};

interface BlogPost {
  id: number;
  title: string;
  company?: string;
  summary?: string;
  imageUrl: string;
  tags?: string[];
  recommendations?: number;
  views?: number;
  brandColor?: string;
  content?: string;
  url?: string;
  blogType?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  successMessage: string;
  setSuccessMessage: (message: string) => void;
}

function RecommendModal({ isOpen, onClose, onSubmit, successMessage, setSuccessMessage }: ModalProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(url);
      setSuccessMessage('추천해주셔서 감사합니다!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('추천 등록 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4 text-[#4C8CF7]">블로그 글 추천하기</h2>
            {successMessage && (
              <div className="text-green-600 text-center py-4">
                {successMessage}
              </div>
            ) || (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#4C8CF7] focus:border-[#4C8CF7]"
                    placeholder="https://example.com/blog-post"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !url}
                    className={`px-4 py-2 text-sm font-medium text-white bg-[#4C8CF7] rounded-md hover:bg-[#3A7DE8] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? '추천 중...' : '추천하기'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">오류 발생</h2>
            <p className="text-gray-600 mb-4">죄송합니다. 페이지를 다시 로드해주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              다시 로드하기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

  const handleRecommendClick = () => {
    setIsRecommendModalOpen(true);
  };

  const handleRecommendSubmit = async (url: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/recommendations', {
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
      setSuccessMessage(`추천 등록 실패: ${error.message}`);
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
  const [page, setPage] = useState(0);

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
    fetch('http://localhost:8080/api/tags')
      .then(res => res.json())
      .then((tags: {id: number, name: string}[]) => setAvailableTags(tags.map(t => t.name)))
      .catch(() => setAvailableTags([]));
  }, []);

  useEffect(() => {
    fetchPosts(0);
  }, []);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSearch = () => {
    setPage(0);
    setHasMore(true);
    fetchPosts(0);
  };

  // 검색 조건이 모두 비어있을 때 자동으로 전체 조회
  useEffect(() => {
    if (!searchQuery.trim() && !selectedBlogType && selectedTags.length === 0) {
      handleSearch();
    }
  }, [searchQuery, selectedBlogType, selectedTags]);

  const fetchPosts = async (currentPage: number): Promise<boolean> => {
    try {
      if (currentPage === 0) setLoading(true);
      else setLoadingMore(true);

      let url = `http://localhost:8080/api/posters?page=${currentPage}&size=${size}`;
      if (searchQuery.trim() || selectedBlogType || selectedTags.length > 0) {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append('keyword', searchQuery.trim());
        }
        if (selectedBlogType) {
          params.append('blogType', selectedBlogType);
        }
        selectedTags.forEach(tag => {
          params.append('tags', tag);
        });
        url = `http://localhost:8080/api/search?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const transformed = data.map((post: any) => ({
        id: post.id,
        title: post.title,
        company: post.blogType || "Unknown Company",
        summary: post.content
          ? post.content.substring(0, 150) + "..."
          : "No summary available",
        imageUrl:
          post.thumbnail ||
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500",
        tags: post.tags || [],
        recommendations: post.recommendations || 0,
        views: post.views || 0,
        brandColor: getBrandColor(post.blogType || ''),
        content: post.content,
        url: post.url,
        blogType: post.blogType,
      }));

      if (currentPage === 0) {
        setPosts(transformed);
      } else {
        setPosts((prev) => [...prev, ...transformed]);
      }
      
      // 검색 결과가 없거나 size보다 작으면 더 이상 데이터가 없다고 판단
      setHasMore(data.length === size);
      return true;
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (currentPage === 0) {
        setPosts([]);
      }
      setHasMore(false);
      return false;
    } finally {
      if (currentPage === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!observerRef.current || loadingMore || !hasMore || loadError) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          const nextPage = page + 1;
          const success = await fetchPosts(nextPage);
          if (success) setPage(nextPage);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [page, loadingMore, hasMore, loadError]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getBrandColor = (blogType: string) => {
    switch (blogType) {
      case 'WOOWABRO':
        return '#40E0D0';
      case 'NAVER':
        return '#03C75A';
      case 'LINE':
        return '#00C300';
      case 'KAKAO_PAY':
        return '#FFCC00';
      case 'KAKAO':
        return '#FFCD00';
      case 'COUPANG':
        return '#0078FF';
      default:
        return '#E5E7EB';
    }
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);
    const viewedKey = `viewed_${post.id}`;
    if (localStorage.getItem(viewedKey) !== '1') {
      fetch(`http://localhost:8080/api/posters/${post.id}/view`, {
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
      await fetch(`http://localhost:8080/api/posters/${postId}/recommend`, {
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
        <h1 className="text-4xl font-bold text-center mb-4">
          Discover Engineering Excellence
        </h1>
        <div className="flex flex-col gap-4">
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
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-xl bg-[#4C8CF7] text-white hover:bg-[#3A7DE8] focus:ring-2 focus:ring-[#4C8CF7]"
            >
              Search
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 pb-16">
        {loading
          ? renderSkeleton(6)
          : posts.map((post) => {
              const blogType = post.blogType || 'UNKNOWN';
              const meta = blogTypeLogos[blogType] ? {
                logo: blogTypeLogos[blogType],
                name: blogType === 'WOOWABRO' ? '우아한형제들' :
                      blogType === 'NAVER' ? '네이버' :
                      blogType === 'LINE' ? '라인' :
                      blogType === 'KAKAO_PAY' ? '카카오페이' :
                      blogType === 'KAKAO' ? '카카오' :
                      blogType === 'COUPANG' ? '쿠팡' : blogType,
                color: blogType === 'WOOWABRO' ? '#40E0D0' :
                       blogType === 'NAVER' ? '#03C75A' :
                       blogType === 'LINE' ? '#00C300' :
                       blogType === 'KAKAO_PAY' ? '#FFCC00' :
                       blogType === 'KAKAO' ? '#FFCD00' :
                       blogType === 'COUPANG' ? '#0078FF' : '#888',
              } : null;
              const isRecommended = localStorage.getItem(`recommended_${post.id}`) === '1';
              return (
                <div
                  key={post.id}
                  className="rounded-2xl overflow-hidden shadow bg-white flex flex-col max-w-xl mx-auto border border-gray-100 mb-8 transition hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                  onClick={() => handlePostClick(post)}
                >
                  {/* 썸네일 */}
                  <div className="bg-gray-200">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover" />
                  </div>
                  {/* 본문 */}
                  <div className="p-7 pb-5 flex flex-col flex-1 border-t border-gray-100 bg-[#F5F6FA]">
                    {/* 키워드(태그) */}
                    <div className="flex gap-2 mb-4">
                      {(post.tags || []).map(tag => (
                        <span
                          key={tag}
                          className="px-4 py-1 rounded-full text-sm font-medium bg-[#ede9fe] text-[#6d28d9]"
                        >
                          {tag}
                        </span>
                      ))}
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
                            style={{ backgroundColor: meta.color, color: '#fff' }}
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
                </div>
              );
            })}
        {loadingMore && renderSkeleton(3)}
        <div ref={observerRef} className="h-1"></div>
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
              className="bg-white max-w-4xl w-full rounded-xl overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedPost.imageUrl && (
                <div className="relative">
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="h-80 w-full object-cover"
                  />
                  {selectedPost.blogType && blogTypeLogos[selectedPost.blogType] && (
                    <div className="absolute top-4 right-4 p-2 bg-white/90 rounded-lg shadow-sm transition-transform duration-200 hover:scale-110">
                      <img
                        src={blogTypeLogos[selectedPost.blogType]}
                        alt={`${selectedPost.blogType} logo`}
                        className={
                          selectedPost.blogType === 'NAVER'
                            ? 'w-8 h-8 object-cover'
                            : selectedPost.blogType === 'WOOWABRO'
                              ? 'w-7 h-7 object-contain'
                              : 'w-8 h-8 object-contain'
                        }
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="p-8">
                <h1 className="text-3xl font-bold mb-4">
                  {selectedPost.title}
                </h1>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
                {selectedPost.url && (
                  <div className="mt-8 text-center">
                    <a
                      href={selectedPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#4C8CF7] text-white px-6 py-3 rounded-lg hover:bg-[#3A7DE8]"
                    >
                      원문 보기 🔗
                    </a>
                  </div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t">
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
                      <Heart className="h-5 w-5" />
                    </button>
                    <span>{selectedPost.recommendations}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Eye className="h-5 w-5" />
                    <span>{selectedPost.views}</span>
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
