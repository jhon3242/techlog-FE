import React, { useState, useEffect, useRef } from 'react';
import { Search, BookMarked, ThumbsUp, Eye, PlusCircle, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(0);
  const size = 10;
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = uuidv4();
      localStorage.setItem('deviceId', newDeviceId);
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

      const response = await fetch(`http://localhost:8080/api/posters?page=${currentPage}&size=${size}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      const transformedPosts = data.map((post: any) => ({
        id: post.id,
        title: post.title,
        company: post.blogType || 'Unknown Company',
        summary: post.content ? post.content.substring(0, 150) + '...' : 'No summary available',
        imageUrl: post.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500',
        tags: [],
        recommendations: post.recommendations || 0,
        views: post.views || 0,
        brandColor: getRandomBrandColor(),
        content: post.content,
        url: post.url,
        blogType: post.blogType
      }));

      if (data.length < size) setHasMore(false);

      setPosts(prev => [...prev, ...transformedPosts]);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load blog posts. Please try again later.');
      return false;
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!observerRef.current || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting) {
        const nextPage = page + 1;
        const success = await fetchPosts(nextPage);
        if (success) setPage(nextPage);
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [page, loadingMore, hasMore]);

  useEffect(() => {
    const handleShowScrollTop = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleShowScrollTop);
    return () => window.removeEventListener('scroll', handleShowScrollTop);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    setSelectedPost(post);

    if (post.id) {
      fetch(`http://localhost:8080/api/posters/${post.id}/view`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        }
      }).catch((err) => {
        console.error('Failed to increment view count', err);
      });
    }
  };

  const handleRecommend = async (postId: number) => {
    try {
      await fetch(`http://localhost:8080/api/posters/${postId}/recommend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        }
      });

      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({
          ...selectedPost,
          recommendations: (selectedPost.recommendations || 0) + 1
        });
      }

      setPosts(prevPosts => prevPosts.map(post =>
        post.id === postId
          ? { ...post, recommendations: (post.recommendations || 0) + 1 }
          : post
      ));
    } catch (err) {
      console.error('Failed to recommend', err);
    }
  };

  const getRandomBrandColor = () => {
    const colors = ['bg-red-50', 'bg-green-50', 'bg-blue-50', 'bg-yellow-50', 'bg-purple-50', 'bg-pink-50'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.company && post.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookMarked className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold text-gray-900">TechBlogArchive</span>
          </div>
          <button className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
            <PlusCircle className="h-5 w-5" />
            <span>💡 Recommend a Tech Blog</span>
          </button>
        </div>
      </nav>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <h1 className="text-4xl font-bold text-center mb-4">Discover Engineering Excellence</h1>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by topic (e.g., Redis, Docker, Architecture)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white/80 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(post => (
              <motion.article
                key={post.id}
                whileHover={{ scale: 1.02 }}
                className={`${post.brandColor} rounded-xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer relative transition-all`}
                onClick={() => handlePostClick(post)}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
                <div className="p-6 flex flex-col">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{post.company}</p>
                  <p className="text-gray-700 line-clamp-3">{post.summary}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-1 bg-indigo-50 px-4 py-2 rounded-lg shadow-sm">
                      <ThumbsUp className="h-5 w-5 text-indigo-600" />
                      <span className="font-semibold">{post.recommendations}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-50 px-4 py-2 rounded-lg shadow-sm">
                      <Eye className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold">{post.views}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
<AnimatePresence>
  {selectedPost && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => {
        setSelectedPost(null);
        requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-xl overflow-hidden shadow-xl max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-80 object-cover" />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{selectedPost.title}</h1>
          <div className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</div>

          {/* 👉 원문 링크 버튼 추가 */}
          {selectedPost.url && (
            <div className="mt-8 flex justify-center">
              <a
                href={selectedPost.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-lg font-semibold"
              >
                원문 보기 🔗
              </a>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
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