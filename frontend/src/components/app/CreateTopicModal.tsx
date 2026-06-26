import React, { useState } from 'react';
import { X } from 'lucide-react';
import { forumService, CATEGORIES, TrustLevel, ForumCategory } from '../../services/forumService';
import Button from '../ui/Button';

const TRUST_LABEL: Record<TrustLevel, string> = {
  basic: 'All members (Basic+)',
  verified: 'Verified members and above',
  trusted: 'Trusted members and above',
  moderator: 'Moderators and above',
  admin: 'Admin only',
};

interface Props {
  trustOptions: TrustLevel[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTopicModal: React.FC<Props> = ({ trustOptions, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ForumCategory>(CATEGORIES[4]); // General Discussion default
  const [minTrust, setMinTrust] = useState<TrustLevel>(trustOptions[0] ?? 'basic');
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await forumService.createPost({
        title: title.trim(),
        content: content.trim(),
        category,
        min_trust_level: minTrust,
        is_anonymous: isAnon,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Post</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What's your topic?"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ForumCategory)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience, question, or insight…"
            />
          </div>

          {/* Visibility (only shown if user has more than one option) */}
          {trustOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visible to
              </label>
              <select
                value={minTrust}
                onChange={(e) => setMinTrust(e.target.value as TrustLevel)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {trustOptions.map((level) => (
                  <option key={level} value={level}>
                    {TRUST_LABEL[level]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                All members at or above the selected level will see this post.
              </p>
            </div>
          )}

          {/* Anonymous */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnon}
              onChange={(e) => setIsAnon(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Post anonymously (uses your anonymous handle)
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} disabled={!title.trim() || !content.trim()}>
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTopicModal;
