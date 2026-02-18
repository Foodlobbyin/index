import api from './api';

export interface ForumTopic {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  viewCount: number;
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicInput {
  title: string;
  category: string;
  content: string;
}

export interface CreateReplyInput {
  content: string;
}

// Mock data for forum - will be replaced with real API calls
const mockTopics: ForumTopic[] = [
  {
    id: '1',
    title: 'Quality Issues with Turmeric Suppliers',
    category: 'Quality Issues',
    content: 'Has anyone experienced inconsistent quality with turmeric shipments? Looking for recommendations on reliable suppliers.',
    author: 'Rajesh Kumar',
    authorId: 'user1',
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-02-15T10:30:00Z',
    replyCount: 5,
    viewCount: 23,
  },
  {
    id: '2',
    title: 'Payment Delays from Major Buyer',
    category: 'Payment Delays',
    content: 'Experiencing 60+ day payment delays. What are others doing to manage cash flow?',
    author: 'Meera Patel',
    authorId: 'user2',
    createdAt: '2024-02-14T14:20:00Z',
    updatedAt: '2024-02-15T09:15:00Z',
    replyCount: 8,
    viewCount: 45,
  },
  {
    id: '3',
    title: 'New Export Regulations for Spices',
    category: 'Export',
    content: 'Discussion about recent changes in export documentation requirements.',
    author: 'Amit Singh',
    authorId: 'user3',
    createdAt: '2024-02-13T16:45:00Z',
    updatedAt: '2024-02-14T11:30:00Z',
    replyCount: 12,
    viewCount: 67,
  },
  {
    id: '4',
    title: 'Logistics Challenges in North Region',
    category: 'Logistics',
    content: 'Looking for reliable transport partners for cold storage deliveries.',
    author: 'Priya Sharma',
    authorId: 'user4',
    createdAt: '2024-02-12T09:00:00Z',
    updatedAt: '2024-02-13T15:20:00Z',
    replyCount: 3,
    viewCount: 18,
  },
];

const mockReplies: Record<string, ForumReply[]> = {
  '1': [
    {
      id: 'r1',
      topicId: '1',
      content: 'We switched to a supplier in Kerala and quality has been much better. Happy to share contact.',
      author: 'Sunita Reddy',
      authorId: 'user5',
      createdAt: '2024-02-15T11:15:00Z',
      updatedAt: '2024-02-15T11:15:00Z',
    },
    {
      id: 'r2',
      topicId: '1',
      content: 'Quality testing at source is crucial. We now require certificates before accepting shipments.',
      author: 'Vikram Joshi',
      authorId: 'user6',
      createdAt: '2024-02-15T12:30:00Z',
      updatedAt: '2024-02-15T12:30:00Z',
    },
  ],
  '2': [
    {
      id: 'r3',
      topicId: '2',
      content: 'We use invoice financing to bridge the gap. Check with your bank about supply chain financing options.',
      author: 'Karan Malhotra',
      authorId: 'user7',
      createdAt: '2024-02-14T15:00:00Z',
      updatedAt: '2024-02-14T15:00:00Z',
    },
  ],
};

export const forumService = {
  async getTopics(category?: string): Promise<ForumTopic[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (category) {
      return mockTopics.filter(t => t.category === category);
    }
    return mockTopics;
  },

  async getTopic(id: string): Promise<ForumTopic | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockTopics.find(t => t.id === id) || null;
  },

  async createTopic(input: CreateTopicInput): Promise<ForumTopic> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newTopic: ForumTopic = {
      id: String(mockTopics.length + 1),
      ...input,
      author: 'Current User', // Will be from auth context
      authorId: 'currentUserId',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
      viewCount: 0,
    };
    
    mockTopics.unshift(newTopic);
    return newTopic;
  },

  async getReplies(topicId: string): Promise<ForumReply[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockReplies[topicId] || [];
  },

  async createReply(topicId: string, input: CreateReplyInput): Promise<ForumReply> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newReply: ForumReply = {
      id: `r${Date.now()}`,
      topicId,
      content: input.content,
      author: 'Current User',
      authorId: 'currentUserId',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (!mockReplies[topicId]) {
      mockReplies[topicId] = [];
    }
    mockReplies[topicId].push(newReply);
    
    // Update reply count
    const topic = mockTopics.find(t => t.id === topicId);
    if (topic) {
      topic.replyCount++;
    }
    
    return newReply;
  },

  getCategories(): string[] {
    return [
      'Quality Issues',
      'Payment Delays',
      'Logistics',
      'Export',
      'Import',
      'Regulatory',
      'General Discussion',
    ];
  },
};
