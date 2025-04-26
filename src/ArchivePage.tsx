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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false); // 🚨 실패 감지용 추가
  const size = 10;

  useEffect(() => {
    const storedDeviceId = localStorage.getItem("deviceId");
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = uuidv4();
      localStorage.setItem("deviceId", newDeviceId);
      setDeviceId(newDeviceId);
    }
  }, []);

  useEffect(() => {
    loadInitialPosts();
  }, []);

  const loadInitialPosts = async () => {
    const success = await fetchPosts(0);
    if (success) setPage(0);
  };

  const fetchPosts = async (currentPage: number): Promise<boolean> => {
    try {
      if (currentPage === 0) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(
        `http://localhost:8080/api/posters?page=${currentPage}&size=${size}`
      );
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
        tags: [],
        recommendations: post.recommendations || 0,
        views: post.views || 0,
        brandColor: getRandomBrandColor(),
        content: post.content,
        url: post.url,
        blogType: post.blogType,
      }));

      setPosts((prev) => [...prev, ...transformed]);
      if (data.length < size) setHasMore(false);

      return true;
    } catch {
      console.error("Failed to fetch posts");
      setHasMore(false); // 🚨 실패했으면 더 이상 불러오기 안 함
      setLoadError(true); // 🚨 실패 감지
      return false;
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  const getRandomBrandColor = () => {
    const colors = [
      "bg-red-50",
      "bg-green-50",
      "bg-blue-50",
      "bg-yellow-50",
      "bg-purple-50",
      "bg-pink-50",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);

    fetch(`http://localhost:8080/api/posters/${post.id}/view`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId,
      },
    }).catch(console.error);
  };

  const handleRecommend = async (postId: number) => {
    try {
      await fetch(`http://localhost:8080/api/posters/${postId}/recommend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId,
        },
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, recommendations: (p.recommendations || 0) + 1 }
            : p
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost({
          ...selectedPost,
          recommendations: (selectedPost.recommendations || 0) + 1,
        });
      }
    } catch (e) {
      console.error("Failed to recommend", e);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.company &&
        post.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.summary &&
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleScrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen relative">
      {/* Header */}
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

      {/* Search */}
      <div className="pt-16 pb-8 max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">
          Discover Engineering Excellence
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic"
            className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-300 bg-white/80 backdrop-blur focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 pb-16">
        {filteredPosts.map((post) => (
          <motion.article
            key={post.id}
            whileHover={{ scale: 1.02 }}
            className={`${post.brandColor} flex flex-col rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer`}
            onClick={() => handlePostClick(post)}
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-48 w-full object-cover"
            />
            <div className="flex flex-col flex-1 p-6">
              <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{post.company}</p>
              <p className="flex-1 text-gray-700 line-clamp-3">
                {post.summary}
              </p>
              <div className="flex justify-between mt-4 pt-4 border-t">
                <div className="flex items-center space-x-1 text-indigo-600">
                  <ThumbsUp className="h-5 w-5" />
                  <span>{post.recommendations}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Eye className="h-5 w-5" />
                  <span>{post.views}</span>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
        <div ref={observerRef} className="h-1"></div>
      </div>

      {/* Modal */}
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
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  className="h-80 w-full object-cover"
                />
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
                  <button
                    className="flex items-center space-x-1 text-indigo-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedPost.id) handleRecommend(selectedPost.id);
                    }}
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span>{selectedPost.recommendations}</span>
                  </button>
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

      {/* ScrollTop */}
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
