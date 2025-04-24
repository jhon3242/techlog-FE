import React, { useState, useEffect } from 'react';
import { Search, BookMarked, ThumbsUp, Eye, PlusCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [deviceId, setDeviceId] = useState<string>('');

  // Initialize device ID
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
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/posters');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw API data:', data);
        
        // Transform the API data to match our BlogPost interface
        const transformedPosts = data.map((post: any, index: number) => {
          const transformedPost = {
            id: index + 1,
            title: post.title,
            company: post.blogType || 'Unknown Company',
            summary: post.content ? post.content.substring(0, 150) + '...' : 'No summary available',
            imageUrl: post.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500',
            tags: [],
            recommendations: post.recommendations || Math.floor(Math.random() * 500),
            views: post.views || Math.floor(Math.random() * 10000),
            brandColor: getRandomBrandColor(),
            content: post.content,
            url: post.url,
            blogType: post.blogType
          };
          console.log('Transformed post:', transformedPost);
          return transformedPost;
        });
        
        setPosts(transformedPosts);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load blog posts. Please try again later.');
        setPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const fetchPostById = async (id: number) => {
    try {
      setLoadingPost(true);
      const response = await fetch(`http://localhost:8080/api/posters/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the API data to match our BlogPost interface
      const post: BlogPost = {
        id: id,
        title: data.title,
        company: data.blogType || 'Unknown Company',
        summary: data.content ? data.content.substring(0, 150) + '...' : 'No summary available',
        imageUrl: data.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500',
        tags: [],
        recommendations: data.recommendations || 0,
        views: data.views || 0,
        brandColor: getRandomBrandColor(),
        content: data.content,
        url: data.url,
        blogType: data.blogType
      };
      
      setSelectedPost(post);
      setError(null);

      // Send view count update
      await fetch(`http://localhost:8080/api/posters/${id}/view`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        }
      });
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load blog post. Please try again later.');
    } finally {
      setLoadingPost(false);
    }
  };

  const handleRecommend = async (postId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/posters/${postId}/recommend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update recommendation');
      }

      // Update the post's recommendation count in the UI
      if (selectedPost) {
        setSelectedPost({
          ...selectedPost,
          recommendations: (selectedPost.recommendations || 0) + 1
        });
      }
    } catch (err) {
      console.error('Error updating recommendation:', err);
    }
  };

  const handlePostClick = (post: BlogPost) => {
    setScrollPosition(window.scrollY);
    fetchPostById(post.id || 1);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  };

  // Helper function to get a random brand color
  const getRandomBrandColor = () => {
    const colors = ['bg-red-50', 'bg-green-50', 'bg-blue-50', 'bg-yellow-50', 'bg-purple-50', 'bg-pink-50'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Sample posts as fallback
  const samplePosts: BlogPost[] = [
    {
      id: 1,
      title: "Scaling Redis at Netflix",
      company: "Netflix",
      summary: "How we optimized Redis clusters to handle millions of concurrent streams",
      imageUrl: "https://images.unsplash.com/photo-1626379953822-baec19c3accd?auto=format&fit=crop&q=80&w=500",
      tags: ["Backend", "Database", "Redis", "Scaling"],
      recommendations: 342,
      views: 15420,
      brandColor: "bg-red-50"
    },
    {
      id: 2,
      title: "Building Uber's Next-Gen Metrics Platform",
      company: "Uber",
      summary: "A deep dive into our new metrics collection and analysis system",
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500",
      tags: ["Architecture", "Metrics", "Backend"],
      recommendations: 256,
      views: 12800,
      brandColor: "bg-green-50"
    }
  ];

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.company && post.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen">
      {/* Navigation */}
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

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Discover Engineering Excellence
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Explore the best engineering blogs from top tech companies
        </p>
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

      {/* Blog Posts Grid */}
      {!selectedPost && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
              {error}
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
                  layoutId={`post-${post.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className={`${post.brandColor || 'bg-white'} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-80 cursor-pointer relative`}
                  onClick={() => handlePostClick(post)}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={post.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500'}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{post.company}</p>
                      <p className="text-gray-700 mb-4 line-clamp-3">{post.summary}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full text-sm bg-white/90 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-1 bg-indigo-50 px-4 py-2 rounded-lg shadow-sm">
                        <ThumbsUp className="h-5 w-5 text-indigo-600" />
                        <span className="font-semibold text-indigo-700">
                          {post.recommendations || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gray-50 px-4 py-2 rounded-lg shadow-sm">
                        <Eye className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold text-gray-700">
                          {post.views || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single Post View */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackToList}
          >
            <motion.article
              layoutId={`post-${selectedPost.id}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/20"></div>
                <img
                  src={selectedPost.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500'}
                  alt={selectedPost.title}
                  className="w-full h-80 object-cover"
                />
              </div>
              <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedPost.title}</h1>
                <p className="text-lg text-gray-600 mb-4">
                  {selectedPost.blogType} · {selectedPost.company}
                </p>
                
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-sm bg-indigo-50 text-indigo-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="prose max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</div>
                </div>
                
                {selectedPost.url && (
                  <div className="mt-8">
                    <a 
                      href={selectedPost.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Read Original Post
                    </a>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
                  <button 
                    className="flex items-center space-x-1 hover:text-indigo-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedPost?.id) {
                        handleRecommend(selectedPost.id);
                      }
                    }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{selectedPost?.recommendations || 0}</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{selectedPost?.views || 0}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;