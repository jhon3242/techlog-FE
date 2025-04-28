import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  BookMarked,
  ThumbsUp,
  Eye,
  PlusCircle,
  ArrowUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

const blogTypeLogos: { [key: string]: string } = {
  WOOWABRO: "https://i.namu.wiki/i/FyZnY5OkZxDhMDC35TdeeSd0a32S0yvts4LXrY0jpgDNGCWeFhL5CSRS7Yldg4RGlToUPbL_5ZxrZLCXhl-xAQ.webp",
  NAVER: "https://i.namu.wiki/i/lfkksp4m3ZymQ-3w_dBOe-DAJ8hHkKq2-ULvmbujKyOyx0tsBKOWyNW9gRVMI5fl1T16k6X2H7a22lzi83wZeImS4Mxo-A8bmuORjIEnIumh4p6_p0dU5S-NyUPvlwbRptojQgGA-GCgH5kdOtDr_g.svg",
  LINE: "https://i.namu.wiki/i/4lZMO-XK7Pdyn7A84kBwZyJW_1PwsF53s8AICTYe6nGHEyKmA1tBoKU1ZEclRYRYqkcjvrdp01xpUTB76HD09yf4x597jKS5l9K8XWMoqPjfEJjee0wd8G5rxZluqyUc1nlh2zp1koxmfa9xAcTLjA.svg",
  KAKAO_PAY: "https://i.namu.wiki/i/e--EGUzVmBMZ97iEgts-8FmlaWmkHnNyFDdg47f2LYky8CGtudl4QI27F-6oXPpOqqIJTbfPUfJcUKyves2_12OQpPjP3mnpM_zYSNYgqRLHnDiU9CSTXdELMIXGpcrC0OTvfX1xUF3M1x9WTmNQNw.svg",
  KAKAO: "https://i.namu.wiki/i/icAd1BeTb2rxauXY3zI9xWa2qKTRBFRrgBJQpjqkS8StK3Y4S2d4xGrIWgP82YuC66cJSxBkaUIhaBI8RQ0gqeRC4KFfykoSL6x9dt3SjIJ66svHxMgSzHhbCQsx-vNUF3AjXdVnY4Ld9dXrweKhkg.svg",
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

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlogType, setSelectedBlogType] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const size = 10;

  useEffect(() => {
    const storedDeviceId = localStorage.getItem("deviceId");
    if (storedDeviceId) setDeviceId(storedDeviceId);
    else {
      const newDeviceId = uuidv4();
      localStorage.setItem("deviceId", newDeviceId);
      setDeviceId(newDeviceId);
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
        return 'bg-white border-t-4 border-[#40E0D0] hover:shadow-[0_4px_12px_rgba(64,224,208,0.15)]';
      case 'NAVER':
        return 'bg-white border-t-4 border-[#03C75A] hover:shadow-[0_4px_12px_rgba(3,199,90,0.15)]';
      case 'LINE':
        return 'bg-white border-t-4 border-[#00C300] hover:shadow-[0_4px_12px_rgba(0,195,0,0.15)]';
      case 'KAKAO_PAY':
        return 'bg-white border-t-4 border-[#FFCC00] hover:shadow-[0_4px_12px_rgba(255,204,0,0.15)]';
      case 'KAKAO':
        return 'bg-white border-t-4 border-[#FFCD00] hover:shadow-[0_4px_12px_rgba(255,205,0,0.15)]';
      case 'COUPANG':
        return 'bg-white border-t-4 border-[#0078FF] hover:shadow-[0_4px_12px_rgba(0,120,255,0.15)]';
      default:
        return 'bg-white border-t-4 border-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]';
    }
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);
    fetch(`http://localhost:8080/api/posters/${post.id}/view`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
    }).catch(console.error);
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
          <div className="flex items-center space-x-2">
            <BookMarked className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold">TechBlogArchive</span>
          </div>
          <button className="flex items-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            <PlusCircle className="h-5 w-5" />
            <span>Recommend</span>
          </button>
        </div>
      </nav>

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
                className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-300 bg-white/80 backdrop-blur focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedBlogType}
              onChange={(e) => setSelectedBlogType(e.target.value)}
              className="py-3 px-4 rounded-xl border border-gray-300 bg-white/80 backdrop-blur focus:ring-2 focus:ring-indigo-500"
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
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
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
                    ? 'bg-indigo-600 text-white'
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
          : posts.map((post) => (
              <motion.article
                key={post.id}
                whileHover={{ scale: 1.02 }}
                className={`${getBrandColor(post.blogType || '')} flex flex-col rounded-xl overflow-hidden shadow-md transition-all cursor-pointer`}
                onClick={() => handlePostClick(post)}
              >
                <div className="relative">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                  />
                  {post.blogType && blogTypeLogos[post.blogType] && (
                    <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow-sm transition-transform duration-200 hover:scale-110">
                      <img 
                        src={blogTypeLogos[post.blogType]} 
                        alt={`${post.blogType} logo`}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-6">
                  <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{post.company}</p>
                  <p className="flex-1 text-gray-700 line-clamp-3">
                    {post.summary}
                  </p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {(post.tags && post.tags.length > 0 ? post.tags : []).map((tag, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-indigo-600">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRecommend(post.id);
                          }}
                          className={`focus:outline-none transition hover:bg-indigo-100 hover:scale-110 rounded-full p-1 cursor-pointer ${
                            localStorage.getItem(`recommended_${post.id}`) === '1' ? 'text-indigo-600' : 'text-gray-400'
                          }`}
                          aria-label="추천하기"
                        >
                          <ThumbsUp className="h-5 w-5" />
                        </button>
                        <span>{post.recommendations}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Eye className="h-5 w-5" />
                        <span>{post.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
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
                        className="w-8 h-8 object-contain"
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
                      className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
                    >
                      원문 보기 🔗
                    </a>
                  </div>
                )}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <div className="flex items-center space-x-1 text-indigo-600">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRecommend(selectedPost.id);
                      }}
                      className={`focus:outline-none transition hover:bg-indigo-100 hover:scale-110 rounded-full p-1 cursor-pointer ${
                        localStorage.getItem(`recommended_${selectedPost.id}`) === '1' ? 'text-indigo-600' : 'text-gray-400'
                      }`}
                      aria-label="추천하기"
                    >
                      <ThumbsUp className="h-5 w-5" />
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
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 shadow-lg"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default App;
