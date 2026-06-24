/**
 * Cloudflare Workers bindings & secrets available on the Hono context (`c.env`).
 * Secrets are injected via `wrangler secret put` / `.dev.vars`; KV via wrangler.toml.
 */
export type Env = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  RECAPTCHA_SECRET_KEY: string;
  MAX_OTP_GENERATION_PER_HOUR: string;
  MAX_OTP_VERIFICATION_ATTEMPTS: string;
  OTP_EXPIRY_MINUTES: string;
  RATE_LIMIT_MAX: string;
  NODE_ENV: string;
  EMAIL_FROM: string;
  RESEND_API_KEY: string;
  GSTN_API_KEY?: string;
  // One-time admin setup secret — set via: wrangler secret put ADMIN_SETUP_KEY
  // Delete or leave unset after first use to permanently disable the setup route.
  ADMIN_SETUP_KEY?: string;
  RATE_LIMIT_KV: KVNamespace;
  EVIDENCE_BUCKET: R2Bucket;
};

/**
 * Variables stored on the Hono context via `c.set(...)`.
 */
export type Variables = {
  user: {
    id: number;
    username: string;
    trust_level?: string;
  };
  validatedBody: unknown;
  uploadedFiles: import('../middleware/upload.middleware').ParsedFile[];
};

/**
 * Convenience binding shape for `new Hono<AppBindings>()`.
 */
export type AppBindings = {
  Bindings: Env;
  Variables: Variables;
};
