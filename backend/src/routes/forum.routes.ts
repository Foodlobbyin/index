import { Hono } from 'hono';
import type { AppBindings } from '../types/env';
import { authMiddleware } from '../middleware/auth.middleware';
import forumController from '../controllers/forum.controller';

const router = new Hono<AppBindings>();

// All forum routes require authentication
router.use('*', authMiddleware);

// ── Posts ─────────────────────────────────────────────────
// GET  /api/forum/posts            — list posts (filtered by caller's trust level)
// POST /api/forum/posts            — create a post
// GET  /api/forum/posts/:id        — get single post with replies
// DELETE /api/forum/posts/:id      — delete own post (or mod/admin)

router.get('/posts', forumController.getPosts);
router.post('/posts', forumController.createPost);
router.get('/posts/:id', forumController.getPost);
router.delete('/posts/:id', forumController.deletePost);

// ── Replies ────────────────────────────────────────────────
// POST   /api/forum/posts/:id/replies     — add reply to a post
// DELETE /api/forum/replies/:id           — delete own reply (or mod/admin)

router.post('/posts/:id/replies', forumController.createReply);
router.delete('/replies/:id', forumController.deleteReply);

// ── Votes ──────────────────────────────────────────────────
// POST /api/forum/posts/:id/vote          — upvote/downvote a post
// POST /api/forum/replies/:id/vote        — upvote/downvote a reply

router.post('/posts/:id/vote', forumController.votePost);
router.post('/replies/:id/vote', forumController.voteReply);

// ── Anon handle ────────────────────────────────────────────
// PUT /api/forum/anon-handle              — set/update anon handle

router.put('/anon-handle', forumController.setAnonHandle);

export default router;
