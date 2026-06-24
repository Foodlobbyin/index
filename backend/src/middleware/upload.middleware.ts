// Phase 2: multer disk storage will be replaced with Cloudflare R2 + request.formData()
// Stub so the bundler does not try to resolve multer/fs/path

import type { Context, Next } from 'hono';

export const uploadMiddleware = {
  array: (_field: string, _max: number) => async (_c: Context, next: Next) => {
    // Phase 2: R2 multipart upload not yet implemented
    await next();
  },
};

export const MAX_FILES = parseInt((globalThis as any).MAX_FILES_PER_INCIDENT || '3', 10);
