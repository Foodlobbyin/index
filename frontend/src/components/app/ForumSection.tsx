import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { forumService, ForumTopic } from '../../services/forumService';
import Button from '../ui/Button';
import ForumTopicList from './ForumTopicList';
import ForumTopicDetail from './ForumTopicDetail';
import CreateTopicModal from './CreateTopicModal';

const ForumSection: React.FC = () => {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTopics();
  }, [filter]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await forumService.getTopics(filter === 'all' ? undefined : filter);
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic: ForumTopic) => {
    setSelectedTopic(topic);
  };

  const handleBackToList = () => {
    setSelectedTopic(null);
    loadTopics(); // Reload to get updated reply counts
  };

  const handleTopicCreated = async () => {
    setShowCreateModal(false);
    await loadTopics();
  };

  const categories = forumService.getCategories();

  if (selectedTopic) {
    return <ForumTopicDetail topic={selectedTopic} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Industry Forum</h2>
          <p className="text-gray-600">
            Share insights and discuss industry challenges with peers
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" />
          New Topic
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Topics
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Topic List */}
      <ForumTopicList
        topics={topics}
        loading={loading}
        onTopicClick={handleTopicClick}
      />

      {/* Create Topic Modal */}
      {showCreateModal && (
        <CreateTopicModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTopicCreated}
        />
      )}
    </div>
  );
};

export default ForumSection;
