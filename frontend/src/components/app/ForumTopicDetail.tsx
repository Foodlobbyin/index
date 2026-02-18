import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ForumTopic, ForumReply, forumService } from '../../services/forumService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ForumTopicDetailProps {
  topic: ForumTopic;
  onBack: () => void;
}

const ForumTopicDetail: React.FC<ForumTopicDetailProps> = ({ topic, onBack }) => {
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReplies();
  }, [topic.id]);

  const loadReplies = async () => {
    setLoading(true);
    try {
      const data = await forumService.getReplies(topic.id);
      setReplies(data);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await forumService.createReply(topic.id, { content: replyContent });
      setReplyContent('');
      await loadReplies();
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      'Quality Issues': 'danger',
      'Payment Delays': 'warning',
      'Logistics': 'info',
      'Export': 'success',
    };
    return colors[category] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={18} className="mr-2" />
        Back to Topics
      </Button>

      {/* Topic Card */}
      <Card>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{topic.title}</h1>
              <Badge variant={getCategoryColor(topic.category)}>
                {topic.category}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium">{topic.author}</span>
              <span>•</span>
              <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MessageSquare size={16} />
                <span>{topic.replyCount} replies</span>
              </div>
            </div>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{topic.content}</p>
          </div>
        </div>
      </Card>

      {/* Replies Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          Replies ({replies.length})
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id}>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-900">{reply.author}</span>
                    <span>•</span>
                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your thoughts or experiences..."
            required
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={submitting} disabled={!replyContent.trim()}>
              Post Reply
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ForumTopicDetail;
