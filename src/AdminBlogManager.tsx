import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAdminHeader } from './utils/fetchWithAdminHeader';
import AdminRecommendManager from './AdminRecommendManager';
import { BookMarked, PlusCircle, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from './utils/apiConfig';
import { blogTypeLogos, blogTypeColors } from './constants/blogTypes';

interface BlogResponse {
  title: string;
  thumbnail: string | null;
  content: string;
  url: string;
  blogType: string;
  tags?: string[];
}

const blogTypes = [
  { value: "WOOWABRO", label: "우아한형제들" },
  { value: "NAVER", label: "네이버" },
  { value: "LINE", label: "라인" },
  { value: "KAKAO_PAY", label: "카카오페이" },
  { value: "KAKAO", label: "카카오" },
  { value: "COUPANG", label: "쿠팡" }
];

function AdminBlogManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'blogs' | 'recommendations' | 'tags'>('blogs');
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postedBlogs, setPostedBlogs] = useState<BlogResponse[]>([]);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [tagInputs, setTagInputs] = useState<{ [key: number]: string }>({});

  const [page, setPage] = useState(0);
  const size = 10;
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [postSearch, setPostSearch] = useState('');
  const [selectedBlogType, setSelectedBlogType] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const [currentBlogIndex, setCurrentBlogIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    thumbnail: '',
    content: '',
    url: '',
    blogType: '',
    tags: [] as string[]
  });
  const [newEditTag, setNewEditTag] = useState('');

  // 태그 목록 불러오기
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/tags`)
      .then(res => res.json())
      .then((tags: {id: number, name: string}[]) => setRecommendedTags(tags.map(t => t.name)))
      .catch(() => setRecommendedTags([]));
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
    fetchPosts(null);
  };

  // 검색 조건이 모두 비어있을 때 자동으로 전체 조회
  useEffect(() => {
    if (!postSearch.trim() && !selectedBlogType && selectedTags.length === 0) {
      handleSearch();
    }
  }, [postSearch, selectedBlogType, selectedTags]);

  // 등록된 포스트 목록 불러오기 (무한 스크롤)
  const fetchPosts = async (cursor: number | null) => {
    try {
      if (cursor === null) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (postSearch.trim()) params.append('keyword', postSearch.trim());
      if (selectedBlogType) params.append('blogType', selectedBlogType);
      if (selectedTags.length > 0) selectedTags.forEach(tag => params.append('tags', tag));
      if (cursor) params.append('cursor', cursor.toString());

      const response = await fetchWithAdminHeader(`/api/posters?${params.toString()}`);
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      const { posters, nextCursor, hasNext } = data;
      
      if (cursor === null) {
        setAllPosts(posters || []);
      } else {
        setAllPosts(prev => [...prev, ...(posters || [])]);
      }
      
      setNextCursor(nextCursor);
      setHasNext(hasNext);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      if (cursor === null) {
        setAllPosts([]);
      }
      setHasNext(false);
    } finally {
      if (cursor === null) setLoading(false);
      else setLoadingMore(false);
    }
  };

  // 스켈레톤 UI 렌더링
  const renderSkeleton = (count: number) => {
    return Array(count).fill(0).map((_, index) => (
      <div key={index} className="rounded-2xl overflow-hidden shadow bg-white flex flex-col max-w-xl mx-auto border border-gray-100 mb-8 animate-pulse">
        <div className="bg-gray-200 h-64"></div>
        <div className="p-7 pb-5 flex flex-col flex-1 border-t border-gray-100 bg-[#F5F6FA]">
          <div className="flex gap-2 mb-4">
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-24 bg-gray-200 rounded mb-6"></div>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    if (!observerRef.current || loadingMore || !hasNext) return;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && nextCursor !== null) {
          await fetchPosts(nextCursor);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, hasNext]);

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await fetchWithAdminHeader(`/api/posters/${id}`, { method: 'DELETE' });
    setAllPosts(posts => posts.filter(p => p.id !== id));
  };

  const handleFetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'single') {
        const response = await fetchWithAdminHeader('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: BlogResponse = await response.json();
        setBlogs([data]);
      } else {
        const response = await fetchWithAdminHeader('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: BlogResponse[] = await response.json();
        setBlogs(data);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to crawl blog(s). Please check the URL(s) and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAdminHeader('/api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posters: blogs.map(blog => ({
            title: blog.title,
            thumbnail: blog.thumbnail,
            content: blog.content,
            url: blog.url,
            blogType: blog.blogType || '',  // blogType이 없을 경우 빈 문자열로 처리
            tags: blog.tags
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to save blog posts');

      alert('Blogs successfully posted!');
      setPostedBlogs(blogs);
      setBlogs([]);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError('Failed to save blog posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof BlogResponse, value: string) => {
    const updatedBlogs = [...blogs];
    (updatedBlogs[index] as any)[field] = value;
    setBlogs(updatedBlogs);
  };

  const handleTagAdd = async (index: number, tag: string) => {
    // Convert English tag to uppercase
    const processedTag = /^[a-zA-Z]+$/.test(tag) ? tag.toUpperCase() : tag;
    
    setBlogs(prev => {
      const updated = [...prev];
      const tags = new Set([...(updated[index].tags || [])]);
      if (!tags.has(processedTag)) {
        tags.add(processedTag);
        updated[index].tags = Array.from(tags);
      }
      return updated;
    });
    if (!recommendedTags.includes(processedTag)) {
      try {
        const res = await fetchWithAdminHeader('/api/tag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: processedTag })
        });
        if (res.ok) {
          setRecommendedTags(prev => [...prev, processedTag]);
        }
      } catch {}
    }
  };

  const handleTagRemove = (index: number, tag: string) => {
    setBlogs(prev => {
      const updated = [...prev];
      updated[index].tags = (updated[index].tags || []).filter(t => t !== tag);
      return updated;
    });
  };

  const handleTagInput = (index: number, value: string) => {
    setTagInputs(prev => ({ ...prev, [index]: value }));
  };

  // 태그 삭제 함수 추가
  const handleDeleteTag = async (tag: string) => {
    if (!window.confirm('정말 이 태그를 삭제하시겠습니까?')) return;
    try {
      const response = await fetchWithAdminHeader('/api/tag', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tag })
      });
      if (response.ok) {
        setRecommendedTags(prev => prev.filter(t => t !== tag));
        // 모든 블로그에서도 해당 태그 제거
        setBlogs(prev => prev.map(blog => ({
          ...blog,
          tags: blog.tags?.filter(t => t !== tag) || []
        })));
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  // 새 태그 추가 함수
  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const processedTag = /^[a-zA-Z]+$/.test(newTag) ? newTag.toUpperCase() : newTag;
    
    try {
      const response = await fetchWithAdminHeader('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: processedTag })
      });
      
      if (response.ok) {
        setRecommendedTags(prev => [...prev, processedTag]);
        setNewTag('');
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handlePrevBlog = () => {
    setCurrentBlogIndex(prev => (prev > 0 ? prev - 1 : blogs.length - 1));
  };

  const handleNextBlog = () => {
    setCurrentBlogIndex(prev => (prev < blogs.length - 1 ? prev + 1 : 0));
  };

  const handleEditPost = async (post: any) => {
    setSelectedPost(post);
    setEditForm({
      title: post.title,
      thumbnail: post.thumbnail || '',
      content: post.content,
      url: post.url,
      blogType: post.blogType,
      tags: post.tags || []
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePost = async () => {
    try {
      const response = await fetchWithAdminHeader(`/api/posters/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Failed to update post');

      // Update the post in the list
      setAllPosts(posts => posts.map(p => 
        p.id === selectedPost.id ? { ...p, ...editForm } : p
      ));

      setIsEditModalOpen(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('포스트 업데이트에 실패했습니다.');
    }
  };

  const handleEditTagAdd = (tag: string) => {
    const processedTag = /^[a-zA-Z]+$/.test(tag) ? tag.toUpperCase() : tag;
    if (!editForm.tags.includes(processedTag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, processedTag]
      }));
    }
  };

  const handleEditTagRemove = (tag: string) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleNewEditTagAdd = async () => {
    if (!newEditTag.trim()) return;
    const processedTag = /^[a-zA-Z]+$/.test(newEditTag) ? newEditTag.toUpperCase() : newEditTag;
    
    if (!editForm.tags.includes(processedTag)) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, processedTag]
      }));

      // Add to recommended tags if it's a new tag
      if (!recommendedTags.includes(processedTag)) {
        try {
          const res = await fetchWithAdminHeader('/api/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: processedTag })
          });
          if (res.ok) {
            setRecommendedTags(prev => [...prev, processedTag]);
          }
        } catch (error) {
          console.error('Failed to add new tag:', error);
        }
      }
    }
    setNewEditTag('');
  };

  return (
    <div className="min-h-screen relative">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center">
            <a href="/" className="cursor-pointer">
              <img src="/images/logo.png" alt="TechBlogArchive Logo" className="h-12" />
            </a>
          </div>
          <button className="flex items-center px-4 py-2 rounded-lg bg-[#E6EFFF] text-[#4C8CF7] hover:bg-[#C9DFFF]">
            <PlusCircle className="h-5 w-5" />
            <span>Recommend</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8 pt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'blogs'
                  ? 'bg-[#4C8CF7] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Blog Management
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'recommendations'
                  ? 'bg-[#4C8CF7] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'tags'
                  ? 'bg-[#4C8CF7] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tag Management
            </button>
          </div>
        </div>

        {activeTab === 'blogs' ? (
          <>
            {/* 등록된 포스트 관리 테이블 */}
            <div className="mb-8">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    className="border p-2 rounded-lg flex-1"
                    placeholder="포스트 제목 검색"
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        handleSearch();
                      }
                    }}
                  />
                  <select
                    value={selectedBlogType}
                    onChange={(e) => setSelectedBlogType(e.target.value)}
                    className="border p-2 rounded-lg"
                  >
                    <option value="">전체 블로그</option>
                    {blogTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-[#4C8CF7] text-white rounded-lg hover:bg-[#3A7DE8]"
                  >
                    Search
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendedTags.map((tag) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allPosts.map(post => (
                  <div
                    key={post.id}
                    className="rounded-2xl overflow-hidden shadow bg-white flex flex-col max-w-xl mx-auto border border-gray-100 mb-8 transition hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                    onClick={() => handleEditPost(post)}
                  >
                    {/* 썸네일 */}
                    <div className="bg-gray-200 relative">
                      <img 
                        src={post.thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=500"} 
                        alt={post.title} 
                        className="w-full h-64 object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors duration-200"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                    {/* 본문 */}
                    <div className="p-7 pb-5 flex flex-col flex-1 border-t border-gray-100 bg-[#F5F6FA]">
                      {/* 키워드(태그) */}
                      <div className="flex gap-2 mb-4">
                        {(post.tags || []).map((tag: string) => (
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
                      <p className="text-gray-600 text-base mb-6 line-clamp-3">{post.content?.substring(0, 150) + "..."}</p>
                      {/* 회사/작성자/추천/조회 */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {post.blogType && blogTypeLogos[post.blogType] && (
                              <img
                                src={blogTypeLogos[post.blogType]}
                                alt={post.blogType}
                                className={
                                  post.blogType === 'NAVER'
                                    ? 'w-full h-full object-cover'
                                    : post.blogType === 'WOOWABRO'
                                      ? 'w-8 h-8 object-contain'
                                      : 'w-7 h-7 object-contain'
                                }
                              />
                            )}
                          </div>
                          <span
                            className={`px-4 py-1 rounded-full text-sm font-semibold ${blogTypeColors[post.blogType || ''] || 'bg-gray-200'}`}
                          >
                            {post.blogType === 'WOOWABRO' ? '우아한형제들' :
                             post.blogType === 'NAVER' ? '네이버' :
                             post.blogType === 'LINE' ? '라인' :
                             post.blogType === 'KAKAO_PAY' ? '카카오페이' :
                             post.blogType === 'KAKAO' ? '카카오' :
                             post.blogType === 'COUPANG' ? '쿠팡' : post.blogType}
                          </span>
                        </div>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4C8CF7] hover:underline"
                        >
                          원문 보기
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {loadingMore && renderSkeleton(3)}
                <div ref={observerRef} className="h-1"></div>
              </div>
            </div>

            {/* 모드 선택 */}
            <div className="mb-6">
              <label className="mr-4">Mode:</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'single' | 'multi')}
                className="border p-2 rounded-lg"
              >
                <option value="single">Single Blog</option>
                <option value="multi">Multiple Blogs</option>
              </select>
            </div>

            {/* URL 입력 */}
            <div className="mb-6">
              <textarea
                className="w-full border p-3 rounded-lg"
                rows={mode === 'single' ? 2 : 5}
                placeholder={mode === 'single' ? 'Enter one blog URL...' : 'Enter multiple blog URLs...'}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button
                className="mt-4 px-6 py-2 bg-[#4C8CF7] text-white rounded-lg hover:bg-[#3A7DE8]"
                onClick={handleFetchBlogs}
                disabled={loading || urlInput.trim() === ''}
              >
                {loading ? 'Fetching...' : 'Crawl Blog(s)'}
              </button>
            </div>

            {/* 크롤링 결과 표시 및 수정 */}
            {error && <div className="text-red-600 mb-4">{error}</div>}

            {blogs.length > 0 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevBlog}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {currentBlogIndex + 1} / {blogs.length}
                  </span>
                  <button
                    onClick={handleNextBlog}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative w-full overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                      transform: `translateX(-${currentBlogIndex * 100}%)`,
                      width: `${blogs.length * 100}%`
                    }}
                  >
                    {blogs.map((blog, index) => (
                      <div
                        key={index}
                        className="w-full flex-shrink-0 px-4"
                      >
                        <div className="border p-6 rounded-lg shadow bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="font-semibold">Title</label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded-lg"
                                value={blog.title}
                                onChange={(e) => handleChange(index, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="font-semibold">Thumbnail URL</label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded-lg"
                                value={blog.thumbnail || ''}
                                onChange={(e) => handleChange(index, 'thumbnail', e.target.value)}
                              />
                              {blog.thumbnail && (
                                <div className="mt-2 w-full h-48 overflow-hidden rounded-lg border">
                                  <img 
                                    src={blog.thumbnail} 
                                    alt="thumbnail" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.error('Image failed to load:', blog.thumbnail);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <label className="font-semibold">Content</label>
                              <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap break-words">
                                {blog.content}
                              </div>
                              <textarea
                                className="w-full border p-2 rounded-lg mt-2"
                                rows={6}
                                value={blog.content}
                                onChange={(e) => handleChange(index, 'content', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="font-semibold">Blog URL</label>
                              <input
                                type="text"
                                className="w-full border p-2 rounded-lg"
                                value={blog.url}
                                onChange={(e) => handleChange(index, 'url', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="font-semibold">Blog Type</label>
                              <select
                                className="w-full border p-2 rounded-lg"
                                value={blog.blogType}
                                onChange={(e) => handleChange(index, 'blogType', e.target.value)}
                              >
                                <option value="">Select Type</option>
                                {blogTypes.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                              {blog.blogType && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                  <span className="text-sm text-gray-600">
                                    Crawled Type: {blogTypes.find(t => t.value === blog.blogType)?.label || blog.blogType}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <label className="font-semibold">Tags</label>
                              <div className="flex flex-wrap gap-2 mb-2 mt-1">
                                {(blog.tags || []).map((tag, i) => (
                                  <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    {tag}
                                    <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={(e) => {
                                      e.stopPropagation();
                                      handleTagRemove(index, tag);
                                    }}>
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <input
                                type="text"
                                className="border p-2 rounded-lg w-full mb-2"
                                placeholder="태그 입력 후 Enter로 추가"
                                value={tagInputs[index] || ""}
                                onChange={e => {
                                  e.preventDefault();
                                  const tag = (e.target as HTMLInputElement).value.trim();
                                  setTagInputs(prev => ({ ...prev, [index]: "" }));
                                  if (tag) handleTagAdd(index, tag);
                                }}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && !(e.nativeEvent as any).isComposing) {
                                    e.preventDefault();
                                    const tag = (e.target as HTMLInputElement).value.trim();
                                    setTagInputs(prev => ({ ...prev, [index]: "" }));
                                    if (tag) handleTagAdd(index, tag);
                                  }
                                }}
                              />
                              <div className="flex flex-wrap gap-2">
                                {recommendedTags.map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    className={`px-3 py-1 rounded-full text-sm border ${blog.tags?.includes(tag) ? 'bg-[#C9DFFF] text-[#4C8CF7] border-indigo-300' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-[#E6EFFF]'}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      blog.tags?.includes(tag) ? handleTagRemove(index, tag) : handleTagAdd(index, tag);
                                    }}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="mt-8 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={handleSaveBlogs}
                >
                  Save Blogs
                </button>
              </div>
            )}

            {/* 저장 완료된 블로그 목록 */}
            {postedBlogs.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-4">Posted Blogs</h2>
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Title</th>
                      <th className="border p-2">Blog Type</th>
                      <th className="border p-2">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postedBlogs.map((blog, index) => (
                      <tr key={index}>
                        <td className="border p-2">{blog.title}</td>
                        <td className="border p-2">{blog.blogType}</td>
                        <td className="border p-2 text-blue-600 underline">
                          <a href={blog.url} target="_blank" rel="noopener noreferrer">Link</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === 'recommendations' ? (
          <AdminRecommendManager />
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                className="flex-1 border p-2 rounded-lg"
                placeholder="새 태그 입력"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleAddTag();
                  }
                }}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-[#4C8CF7] text-white rounded-lg hover:bg-[#3A7DE8]"
              >
                태그 추가
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
                >
                  <span className="font-medium">{tag}</span>
                  <button
                    onClick={() => handleDeleteTag(tag)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">포스트 수정</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-semibold mb-2">제목</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">썸네일 URL</label>
                  <input
                    type="text"
                    value={editForm.thumbnail}
                    onChange={(e) => setEditForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="w-full border p-2 rounded-lg"
                  />
                  {editForm.thumbnail && (
                    <div className="mt-2 w-full h-48 overflow-hidden rounded-lg border">
                      <img 
                        src={editForm.thumbnail} 
                        alt="thumbnail" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-2">내용</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">URL</label>
                  <input
                    type="text"
                    value={editForm.url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">블로그 타입</label>
                  <select
                    value={editForm.blogType}
                    onChange={(e) => setEditForm(prev => ({ ...prev, blogType: e.target.value }))}
                    className="w-full border p-2 rounded-lg"
                  >
                    <option value="">선택</option>
                    {blogTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-2">태그</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-[#ede9fe] text-[#6d28d9] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTagRemove(tag);
                          }}
                          className="ml-1 text-[#6d28d9] hover:text-[#4c1d95]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newEditTag}
                      onChange={(e) => setNewEditTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          handleNewEditTagAdd();
                        }
                      }}
                      placeholder="새 태그 입력 후 Enter"
                      className="flex-1 border p-2 rounded-lg"
                    />
                    <button
                      onClick={handleNewEditTagAdd}
                      className="px-4 py-2 bg-[#4C8CF7] text-white rounded-lg hover:bg-[#3A7DE8]"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTags.map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTagAdd(tag);
                        }}
                        className={`px-3 py-1 rounded-full text-sm ${
                          editForm.tags.includes(tag)
                            ? 'bg-[#C9DFFF] text-[#4C8CF7]'
                            : 'bg-gray-100 text-gray-600 hover:bg-[#E6EFFF]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdatePost}
                    className="px-4 py-2 bg-[#4C8CF7] text-white rounded-lg hover:bg-[#3A7DE8]"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBlogManager;