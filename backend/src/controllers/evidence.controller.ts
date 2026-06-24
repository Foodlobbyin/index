// Phase 2: evidence upload/download will be re-implemented with Cloudflare R2
// Stub so the bundler does not try to resolve fs/path/express

import type { Context } from 'hono';

export class EvidenceController {
  async upload(c: Context): Promise<Response> {
    return c.json({ error: 'Evidence upload not yet available — coming in Phase 2 (R2 storage)' }, 501);
  }

  async download(c: Context): Promise<Response> {
    return c.json({ error: 'Evidence download not yet available — coming in Phase 2 (R2 storage)' }, 501);
  }
}

export default new EvidenceController();
