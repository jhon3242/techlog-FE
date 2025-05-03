import React, { useState, useEffect } from 'react';
import { fetchWithAdminHeader } from './utils/fetchWithAdminHeader';
import { ThumbsUp, ThumbsDown, Check, X } from 'lucide-react';
import { API_BASE_URL } from './utils/apiConfig';

interface RecommendedPost {
  id: number;
  title: string;
  url: string;
  recommendedBy: string;
  recommendedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

function AdminRecommendManager() {
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendedPosts();
  }, []);

  const fetchRecommendedPosts = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAdminHeader('/api/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendedPosts(data);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetchWithAdminHeader(`/api/recommendations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');

      setRecommendedPosts(prev => 
        prev.map(post => 
          post.id === id ? { ...post, status } : post
        )
      );
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Recommended Posts Management</h1>
      
      <div className="space-y-6">
        {recommendedPosts.map((post) => (
          <div key={post.id} className="border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <a 
                  href={post.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {post.url}
                </a>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(post.status)}`}>
                {post.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">Recommended by:</span> {post.recommendedBy}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(post.recommendedAt).toLocaleDateString()}
              </div>
            </div>

            {post.status === 'PENDING' && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => handleStatusChange(post.id, 'APPROVED')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange(post.id, 'REJECTED')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminRecommendManager; 