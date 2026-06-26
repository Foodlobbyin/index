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

export interface Announcement {
  id: number;
  title: string;
  content: string;
  posted_at: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  posted_at?: string; // ISO string — optional, defaults to now
}

export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  posted_at?: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const forumService = {
  /** List posts visible to the caller. Optionally filter by category. */
  async getPosts(category?: string): Promise<{ posts: ForumPost[]; trust_options: TrustLevel[] }> {
    const params = category ? { category } : {};
    const res = await api.get('/forum/posts', { params });
    return res.data;
  },

  /** Get a single post with all replies. */
  async getPost(id: number): Promise<{ post: ForumPost; replies: ForumReply[] }> {
    const res = await api.get(`/forum/posts/${id}`);
    return res.data;
  },

  /** Create a new post. */
  async createPost(input: CreatePostInput): Promise<ForumPost> {
    const res = await api.post('/forum/posts', input);
    return res.data;
  },

  /** Delete a post (own posts, or mod/admin deleting any). */
  async deletePost(id: number): Promise<void> {
    await api.delete(`/forum/posts/${id}`);
  },

  /** Add a reply to a post. */
  async createReply(postId: number, input: CreateReplyInput): Promise<ForumReply> {
    const res = await api.post(`/forum/posts/${postId}/replies`, input);
    return res.data;
  },

  /** Delete a reply (own replies, or mod/admin). */
  async deleteReply(id: number): Promise<void> {
    await api.delete(`/forum/replies/${id}`);
  },

  /** Vote on a post. Sending the same vote again toggles it off. */
  async votePost(id: number, vote_type: 'up' | 'down'): Promise<VoteResult> {
    const res = await api.post(`/forum/posts/${id}/vote`, { vote_type });
    return res.data;
  },

  /** Vote on a reply. Sending the same vote again toggles it off. */
  async voteReply(id: number, vote_type: 'up' | 'down'): Promise<VoteResult> {
    const res = await api.post(`/forum/replies/${id}/vote`, { vote_type });
    return res.data;
  },

  /** Set or update the caller's anonymous forum handle. */
  async setAnonHandle(handle: string): Promise<{ forum_anon_handle: string }> {
    const res = await api.put('/forum/anon-handle', { handle });
    return res.data;
  },

  // ── Announcements ────────────────────────────────────────

  /** Get all announcements (all authenticated users). */
  async getAnnouncements(): Promise<Announcement[]> {
    const res = await api.get('/forum/announcements');
    return res.data.announcements;
  },

  /** Create a new announcement entry (admin only). */
  async createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
    const res = await api.post('/forum/announcements', input);
    return res.data;
  },

  /** Update an announcement entry (admin only). */
  async updateAnnouncement(id: number, input: UpdateAnnouncementInput): Promise<Announcement> {
    const res = await api.put(`/forum/announcements/${id}`, input);
    return res.data;
  },

  /** Delete an announcement entry (admin only). */
  async deleteAnnouncement(id: number): Promise<void> {
    await api.delete(`/forum/announcements/${id}`);
  },
};
