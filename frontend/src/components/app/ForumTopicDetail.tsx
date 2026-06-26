import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, Trash2, Send } from 'lucide-react';
import { forumService, ForumPost, ForumReply } from '../../services/forumService';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Props {
  postId: number;
  onBack: () => void;
}

const ForumTopicDetail: React.FC<Props> = ({ postId, onBack }) => {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnon, setReplyAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.getPost(postId);
      setPost(data.post);
      setReplies(data.replies);
    } catch {
      setError('Failed to load post.');
    } finally {
      setLoading(false);
    }
  };

  const handleVotePost = async (voteType: 'up' | 'down') => {
    if (!post) return;
    try {
      const result = await forumService.votePost(post.id, voteType);
      setPost(prev => prev ? { ...prev, ...result } : prev);
    } catch { /* ignore */ }
  };

  const handleVoteReply = async (replyId: number, voteType: 'up' | 'down') => {
    try {
      const result = await forumService.voteReply(replyId, voteType);
      setReplies(prev =>
        prev.map(r => r.id === replyId ? { ...r, ...result } : r)
      );
    } catch { /* ignore */ }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      await forumService.deleteReply(replyId);
      setReplies(prev => prev.filter(r => r.id !== replyId));
      setPost(prev => prev ? { ...prev, reply_count: Math.max(0, prev.reply_count - 1) } : prev);
    } catch { /* ignore */ }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !post) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const reply = await forumService.createReply(post.id, {
        content: replyContent.trim(),
        is_anonymous: replyAnon,
      });
      setReplies(prev => [...prev, reply]);
      setPost(prev => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
      setReplyContent('');
      setReplyAnon(false);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error ?? 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </Button>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? 'Post not found.'}
        </div>
      </div>
    );
  }

  const VoteRow = ({
    upvotes, downvotes, myVote,
    onUp, onDown,
  }: {
    upvotes: number; downvotes: number; myVote: string | null;
    onUp: () => void; onDown: () => void;
  }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={onUp}
        className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold transition-colors
          ${myVote === 'up' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'}`}
      >
        <ChevronUp size={14} strokeWidth={2.5} />
        {upvotes}
      </button>
      <button
        onClick={onDown}
        className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold transition-colors
          ${myVote === 'down' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-500'}`}
      >
        <ChevronDown size={14} strokeWidth={2.5} />
        {downvotes}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Forum
      </button>

      {/* Post */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mb-2">
              {post.category}
            </span>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{post.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
              <span className="font-medium text-gray-600">{post.author}</span>
              <span>•</span>
              <span>
                {new Date(post.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span>{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <VoteRow
            upvotes={post.upvotes}
            downvotes={post.downvotes}
            myVote={post.my_vote}
            onUp={() => handleVotePost('up')}
            onDown={() => handleVotePost('down')}
          />
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-700">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.map((reply) => (
          <div key={reply.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-medium text-gray-700">{reply.author}</span>
                <span>•</span>
                <span>
                  {new Date(reply.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
              {reply.is_own && (
                <button
                  onClick={() => handleDeleteReply(reply.id)}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete reply"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
            <VoteRow
              upvotes={reply.upvotes}
              downvotes={reply.downvotes}
              myVote={reply.my_vote}
              onUp={() => handleVoteReply(reply.id, 'up')}
              onDown={() => handleVoteReply(reply.id, 'down')}
            />
          </div>
        ))}

        {replies.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No replies yet — be the first</p>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Post a Reply</h3>
        {submitError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmitReply} className="space-y-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience or insight…"
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replyAnon}
                onChange={(e) => setReplyAnon(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Post anonymously
            </label>
            <Button type="submit" isLoading={submitting} disabled={!replyContent.trim()}>
              <Send size={14} className="mr-1.5" />
              Reply
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumTopicDetail;
