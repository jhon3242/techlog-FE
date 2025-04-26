import React, { useState } from 'react';

interface BlogResponse {
  title: string;
  thumbnail: string | null;
  content: string;
  url: string;
  blogType: string;
}

const blogTypes = ["WOOWABRO", "NAVER", "TISTORY", "MEDIUM", "BRUNCH"];

function AdminBlogManager() {
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState<string[]>([]);
  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postedBlogs, setPostedBlogs] = useState<BlogResponse[]>([]);

  const handleFetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === 'single') {
        const response = await fetch('http://localhost:8080/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data: BlogResponse = await response.json();
        setBlogs([data]);
      } else {
        const response = await fetch('http://localhost:8080/api/blogs', {
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

      const response = await fetch('http://localhost:8080/api/posters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posters: blogs.map(blog => ({
            title: blog.title,
            thumbnail: blog.thumbnail,
            content: blog.content,
            url: blog.url,
            blogType: blog.blogType
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

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Blog Manager</h1>

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
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
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
    </div>
  );
}

export default AdminBlogManager;