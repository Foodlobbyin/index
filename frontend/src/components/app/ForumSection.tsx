import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { forumService, ForumPost, TrustLevel, CATEGORIES } from '../../services/forumService';
import Button from '../ui/Button';
import ForumTopicList from './ForumTopicList';
import ForumTopicDetail from './ForumTopicDetail';
import CreateTopicModal from './CreateTopicModal';
import AnnouncementsPanel from './AnnouncementsPanel';

const ForumSection: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [trustOptions, setTrustOptions] = useState<TrustLevel[]>(['basic']);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.getPosts(categoryFilter || undefined);
      setPosts(data.posts);
      setTrustOptions(data.trust_options);
    } catch (err: any) {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (selectedPost) {
    return (
      <ForumTopicDetail
        postId={selectedPost.id}
        onBack={() => {
          setSelectedPost(null);
          loadPosts();
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Industry Forum</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Discuss trade, share insights, and stay ahead — vote to surface the best knowledge
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-1.5" />
          New Post
        </Button>
      </div>

      {/* Category Filter — dropdown */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Filter by:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter('')}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Announcements timeline — pinned above post list */}
      <AnnouncementsPanel />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Post List */}
      <ForumTopicList
        posts={posts}
        loading={loading}
        onPostClick={setSelectedPost}
        onVote={async (postId, voteType) => {
          const result = await forumService.votePost(postId, voteType);
          setPosts(prev =>
            prev.map(p =>
              p.id === postId
                ? { ...p, upvotes: result.upvotes, downvotes: result.downvotes, my_vote: result.my_vote }
                : p
            )
          );
        }}
        onDelete={async (postId) => {
          await forumService.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
        }}
      />

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreateTopicModal
          trustOptions={trustOptions}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPosts();
          }}
        />
      )}
    </div>
  );
};

export default ForumSection;
