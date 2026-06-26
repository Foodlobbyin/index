import React from 'react';
import { MessageSquare, ChevronUp, ChevronDown, Trash2, Lock } from 'lucide-react';
import { ForumPost } from '../../services/forumService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Props {
  posts: ForumPost[];
  loading: boolean;
  onPostClick: (post: ForumPost) => void;
  onVote: (postId: number, voteType: 'up' | 'down') => Promise<void>;
  onDelete: (postId: number) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Logistics': 'bg-blue-100 text-blue-700',
  'Exports or Imports': 'bg-green-100 text-green-700',
  'Regulatory': 'bg-purple-100 text-purple-700',
  'Taxes & GST': 'bg-orange-100 text-orange-700',
  'General Discussion': 'bg-gray-100 text-gray-700',
  'Payments': 'bg-yellow-100 text-yellow-700',
  'Banking & Finance': 'bg-teal-100 text-teal-700',
};

const TRUST_LABEL: Record<string, string> = {
  basic: 'All members',
  verified: 'Verified+',
  trusted: 'Trusted+',
  moderator: 'Mods only',
  admin: 'Admin only',
};

const ForumTopicList: React.FC<Props> = ({ posts, loading, onPostClick, onVote, onDelete }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium text-gray-500">No posts yet</p>
        <p className="text-sm mt-1">Be the first to start a discussion</p>
      </div>
    );
  }

  const handleVote = (e: React.MouseEvent, postId: number, voteType: 'up' | 'down') => {
    e.stopPropagation();
    onVote(postId, voteType);
  };

  const handleDelete = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (window.confirm('Delete this post?')) onDelete(postId);
  };

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex gap-3 p-4">
            {/* Vote column */}
            <div
              className="flex flex-col items-center gap-1 pt-0.5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleVote(e, post.id, 'up')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  post.my_vote === 'up' ? 'text-orange-500' : 'text-gray-400'
                }`}
                title="Upvote"
              >
                <ChevronUp size={20} strokeWidth={2.5} />
              </button>
              <span className={`text-sm font-bold leading-none ${
                (post.upvotes - post.downvotes) > 0
                  ? 'text-orange-500'
                  : (post.upvotes - post.downvotes) < 0
                  ? 'text-blue-500'
                  : 'text-gray-500'
              }`}>
                {post.upvotes - post.downvotes}
              </span>
              <button
                onClick={(e) => handleVote(e, post.id, 'down')}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  post.my_vote === 'down' ? 'text-blue-500' : 'text-gray-400'
                }`}
                title="Downvote"
              >
                <ChevronDown size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0" onClick={() => onPostClick(post)}>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {post.category}
                </span>
                {post.min_trust_level !== 'basic' && (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock size={10} />
                    {TRUST_LABEL[post.min_trust_level]}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-blue-600">
                {post.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="font-medium text-gray-600">{post.author}</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}
                </span>
              </div>
            </div>

            {/* Delete (own post only or mod) */}
            {post.is_own && (
              <button
                onClick={(e) => handleDelete(e, post.id)}
                className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                title="Delete post"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForumTopicList;
