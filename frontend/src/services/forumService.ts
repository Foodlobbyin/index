import api from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export type VoteType = 'up' | 'down' | null;

export type TrustLevel = 'basic' | 'verified' | 'trusted' | 'moderator' | 'admin';

export const CATEGORIES = [
  'Logistics',
  'Exports or Imports',
  'Regulatory',
  'Taxes & GST',
  'General Discussion',
  'Payments',
  'Banking & Finance',
] as const;

export type ForumCategory = typeof CATEGORIES[number];

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  category: ForumCategory;
  min_trust_level: TrustLevel;
  is_anonymous: boolean;
  author: string;
  upvotes: number;
  downvotes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  my_vote: VoteType;
  is_own: boolean;
}

export interface ForumReply {
  id: number;
  post_id: number;
  content: string;
  is_anonymous: boolean;
  author: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  my_vote: VoteType;
  is_own: boolean;
}

export interface CreatePostInput {
  title: string;
  content: string;
  category: ForumCategory;
  min_trust_level: TrustLevel;
  is_anonymous: boolean;
}

export interface CreateReplyInput {
  content: string;
  is_anonymous: boolean;
}

export interface VoteResult {
  upvotes: number;
  downvotes: number;
  my_vote: VoteType;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const forumService = {
  /** List posts visible to the caller. Optionally filter by category. */
  async getPosts(category?: string): Promise<{ posts: ForumPost[]; trust_options: TrustLevel[] }> {
    const params = category ? { category } : {};
    const res = await api.get('/api/forum/posts', { params });
    return res.data;
  },

  /** Get a single post with all replies. */
  async getPost(id: number): Promise<{ post: ForumPost; replies: ForumReply[] }> {
    const res = await api.get(`/api/forum/posts/${id}`);
    return res.data;
  },

  /** Create a new post. */
  async createPost(input: CreatePostInput): Promise<ForumPost> {
    const res = await api.post('/api/forum/posts', input);
    return res.data;
  },

  /** Delete a post (own posts, or mod/admin deleting any). */
  async deletePost(id: number): Promise<void> {
    await api.delete(`/api/forum/posts/${id}`);
  },

  /** Add a reply to a post. */
  async createReply(postId: number, input: CreateReplyInput): Promise<ForumReply> {
    const res = await api.post(`/api/forum/posts/${postId}/replies`, input);
    return res.data;
  },

  /** Delete a reply (own replies, or mod/admin). */
  async deleteReply(id: number): Promise<void> {
    await api.delete(`/api/forum/replies/${id}`);
  },

  /** Vote on a post. Sending the same vote again toggles it off. */
  async votePost(id: number, vote_type: 'up' | 'down'): Promise<VoteResult> {
    const res = await api.post(`/api/forum/posts/${id}/vote`, { vote_type });
    return res.data;
  },

  /** Vote on a reply. Sending the same vote again toggles it off. */
  async voteReply(id: number, vote_type: 'up' | 'down'): Promise<VoteResult> {
    const res = await api.post(`/api/forum/replies/${id}/vote`, { vote_type });
    return res.data;
  },

  /** Set or update the caller's anonymous forum handle. */
  async setAnonHandle(handle: string): Promise<{ forum_anon_handle: string }> {
    const res = await api.put('/api/forum/anon-handle', { handle });
    return res.data;
  },
};
