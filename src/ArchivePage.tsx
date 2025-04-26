import React, { useState, useEffect, useRef } from 'react';
import { Search, BookMarked, ThumbsUp, Eye, PlusCircle, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

interface BlogPost {
  id?: number;
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
  thumbnail?: string;
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
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      const transformedPosts = data.map((post: any, index: number) => ({
        id: index + 1 + currentPage * size,
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

      if (data.length < size) {
        setHasMore(false);
      }

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
        if (success) {
          setPage(nextPage);
        }
      }
    }, { threshold: 1.0 });

    observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [page, loadingMore, hasMore]);

  useEffect(() => {
    const handleShowScrollTop = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleShowScrollTop);
    return () => window.removeEventListener('scroll', handleShowScrollTop);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    fetchPosts(page);
  };

  const getRandomBrandColor = () => {
    const colors = ['bg-red-50', 'bg-green-50', 'bg-blue-50', 'bg-yellow-50', 'bg-purple-50', 'bg-pink-50'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.company && post.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
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

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">Discover Engineering Excellence</h1>
        <p className="text-center text-gray-600 mb-8">Explore the best engineering blogs from top tech companies</p>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by topic (e.g., Redis, Docker, Architecture)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white/80 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse rounded-xl bg-gray-200 h-48 w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>
            <button onClick={handleRetry} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
              Retry Loading
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No posts found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <motion.article
              key={post.id}
              whileHover={{ scale: 1.02 }}  // ✅ 확대 효과 추가
              className={`${post.brandColor || 'bg-white'} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-80 cursor-pointer relative`}
              onClick={() => {
                if (post.url) {
                  window.open(post.url, '_blank');  // ✅ 클릭하면 새 창에서 post.url 열기
                }
              }}
            >
              {/* ✅ 오버레이 추가 */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col h-full">
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{post.company}</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{post.summary}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1 bg-indigo-50 px-4 py-2 rounded-lg shadow-sm">
                    <ThumbsUp className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-700">{post.recommendations || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-50 px-4 py-2 rounded-lg shadow-sm">
                    <Eye className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-700">{post.views || 0}</span>
                  </div>
                </div>
              </div>
            </motion.article>
            ))}
          </div>
        )}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
        {!hasMore && (
          <div className="text-center text-gray-500 mt-8">No more posts to load.</div>
        )}
        <div ref={observerRef} className="h-1"></div>
      </div>

      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default App;