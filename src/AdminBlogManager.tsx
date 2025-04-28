import React, { useState, useEffect } from 'react';
import { fetchWithAdminHeader } from './utils/fetchWithAdminHeader';
import AdminRecommendManager from './AdminRecommendManager';
import { BookMarked, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const [activeTab, setActiveTab] = useState<'blogs' | 'recommendations'>('blogs');
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

  // 태그 목록 불러오기
  useEffect(() => {
    fetch('http://localhost:8080/api/tags')
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
    fetchPosts(0);
  };

  // 검색 조건이 모두 비어있을 때 자동으로 전체 조회
  useEffect(() => {
    if (!postSearch.trim() && !selectedBlogType && selectedTags.length === 0) {
      handleSearch();
    }
  }, [postSearch, selectedBlogType, selectedTags]);

  // 등록된 포스트 목록 불러오기 (페이지네이션)
  const fetchPosts = async (currentPage: number) => {
    try {
      let url = `http://localhost:8080/api/posters?page=${currentPage}&size=${size}`;
      if (postSearch.trim() || selectedBlogType || selectedTags.length > 0) {
        const params = new URLSearchParams();
        if (postSearch.trim()) {
          params.append('keyword', postSearch.trim());
        }
        if (selectedBlogType) {
          params.append('blogType', selectedBlogType);
        }
        selectedTags.forEach(tag => {
          params.append('tags', tag);
        });
        url = `http://localhost:8080/api/search?${params.toString()}`;
      }

      const response = await fetchWithAdminHeader(url);
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      setAllPosts(data);
      setHasNext(data.length === size);
    } catch {
      setAllPosts([]);
      setHasNext(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'blogs') {
      fetchPosts(page);
    }
  }, [activeTab, page]);

  const handleDeletePost = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await fetchWithAdminHeader(`http://localhost:8080/api/posters/${id}`, { method: 'DELETE' });
    setAllPosts(posts => posts.filter(p => p.id !== id));
  };

  // 페이지네이션 버튼 생성 (최근 5페이지만)
  const pageButtons = [];
  const startPage = Math.max(0, page - 2);
  for (let i = startPage; i <= page + 2; i++) {
    if (i === page || (i < page && i >= 0) || (i > page && (i === page + 1 && hasNext))) {
      pageButtons.push(i);
    }
  }

  const handleFetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'single') {
        const response = await fetchWithAdminHeader('http://localhost:8080/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: BlogResponse = await response.json();
        setBlogs([data]);
      } else {
        const response = await fetchWithAdminHeader('http://localhost:8080/api/blogs', {
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

      const response = await fetchWithAdminHeader('http://localhost:8080/api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posters: blogs.map(blog => ({
            title: blog.title,
            thumbnail: blog.thumbnail,
            content: blog.content,
            url: blog.url,
            blogType: blog.blogType,
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
        const res = await fetchWithAdminHeader('http://localhost:8080/api/tag', {
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

  return (
    <div className="min-h-screen relative">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <BookMarked className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold">TechBlogArchive</span>
          </div>
          <button className="flex items-center px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
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
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Blog Management
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'recommendations'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recommendations
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">제목</th>
                    <th className="border p-2">링크</th>
                    <th className="border p-2">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {allPosts.map(post => (
                    <tr key={post.id}>
                      <td className="border p-2">{post.title}</td>
                      <td className="border p-2 text-blue-600 underline">
                        <a href={post.url} target="_blank" rel="noopener noreferrer">Link</a>
                      </td>
                      <td className="border p-2">
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-center mt-4 space-x-2">
                {page > 0 && (
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={() => setPage(page - 1)}>
                    이전
                  </button>
                )}
                {pageButtons.map(idx => (
                  <button
                    key={idx}
                    className={`px-3 py-1 rounded ${page === idx ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => setPage(idx)}
                    disabled={idx < 0}
                  >
                    {idx + 1}
                  </button>
                ))}
                {hasNext && (
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={() => setPage(page + 1)}>
                    다음
                  </button>
                )}
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
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
                {blogs.map((blog, index) => (
                  <div key={index} className="border p-6 rounded-lg shadow">
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
                          <img src={blog.thumbnail} alt="thumbnail" className="mt-2 w-full h-48 object-cover rounded" />
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-semibold">Content</label>
                        <textarea
                          className="w-full border p-2 rounded-lg"
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
                          {blogTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-semibold">Tags</label>
                        <div className="flex flex-wrap gap-2 mb-2 mt-1">
                          {(blog.tags || []).map((tag, i) => (
                            <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                              {tag}
                              <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={() => handleTagRemove(index, tag)}>
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
                          onChange={e => handleTagInput(index, e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !(e.nativeEvent as any).isComposing) {
                              e.preventDefault();
                              const tag = (tagInputs[index] || "").trim();
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
                              className={`px-3 py-1 rounded-full text-sm border ${blog.tags?.includes(tag) ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-indigo-50'}`}
                              onClick={() => blog.tags?.includes(tag) ? handleTagRemove(index, tag) : handleTagAdd(index, tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

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
        ) : (
          <AdminRecommendManager />
        )}
      </div>
    </div>
  );
}

export default AdminBlogManager;