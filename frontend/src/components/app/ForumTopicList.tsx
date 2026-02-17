import React from 'react';
import { MessageSquare, Eye } from 'lucide-react';
import { ForumTopic } from '../../services/forumService';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ForumTopicListProps {
  topics: ForumTopic[];
  loading: boolean;
  onTopicClick: (topic: ForumTopic) => void;
}

const ForumTopicList: React.FC<ForumTopicListProps> = ({ topics, loading, onTopicClick }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium mb-2">No topics found</p>
          <p className="text-sm">Be the first to start a discussion!</p>
        </div>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      'Quality Issues': 'danger',
      'Payment Delays': 'warning',
      'Logistics': 'info',
      'Export': 'success',
      'Import': 'success',
      'Regulatory': 'default',
    };
    return colors[category] || 'default';
  };

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <Card
          key={topic.id}
          hover
          className="cursor-pointer"
          onClick={() => onTopicClick(topic)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                  {topic.title}
                </h3>
                <Badge variant={getCategoryColor(topic.category)}>
                  {topic.category}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{topic.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium">{topic.author}</span>
                <span>•</span>
                <span>{new Date(topic.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MessageSquare size={16} />
                  <span>{topic.replyCount} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>{topic.viewCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ForumTopicList;
