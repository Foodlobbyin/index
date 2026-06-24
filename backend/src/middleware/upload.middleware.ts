import type { Context, Next } from 'hono';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
export const MAX_FILES = 3;

export interface ParsedFile {
  filename: string; // generated uuid filename
  originalName: string;
  mimeType: string;
  size: number;
  bytes: ArrayBuffer; // raw bytes to upload to R2
}

// Parses multipart/form-data from the request, validates files, stores on c context
export function uploadMiddleware() {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Request must be multipart/form-data' }, 400);
    }

    const formData = await c.req.raw.formData();
    const fileEntries = formData.getAll('files') as unknown as (File | string)[];

    if (!fileEntries || fileEntries.length === 0) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    if (fileEntries.length > MAX_FILES) {
      return c.json({ error: `Maximum ${MAX_FILES} files allowed` }, 400);
    }

    const parsed: ParsedFile[] = [];
    for (const entry of fileEntries) {
      if (!(entry instanceof File)) continue;

      const ext = '.' + entry.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(entry.type) || !ALLOWED_EXTENSIONS.includes(ext)) {
        return c.json(
          { error: `Invalid file type: ${entry.name}. Allowed: PDF, JPG, JPEG, PNG, DOC, DOCX` },
          400
        );
      }

      const bytes = await entry.arrayBuffer();
      if (bytes.byteLength > MAX_FILE_SIZE) {
        return c.json({ error: `File ${entry.name} exceeds 1MB limit` }, 400);
      }

      const { v4: uuidv4 } = await import('uuid');
      parsed.push({
        filename: `${uuidv4()}${ext}`,
        originalName: entry.name,
        mimeType: entry.type,
        size: bytes.byteLength,
        bytes,
      });
    }

    c.set('uploadedFiles', parsed);
    await next();
  };
}
