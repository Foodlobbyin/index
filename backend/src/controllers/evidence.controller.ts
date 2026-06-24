import type { Context } from 'hono';
import evidenceService from '../services/evidence.service';
import incidentRepository from '../repositories/incident.repository';
import { createDbClient } from '../config/database';
import type { ParsedFile } from '../middleware/upload.middleware';

export class EvidenceController {
  async upload(c: Context): Promise<Response> {
    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const bucket = c.env.EVIDENCE_BUCKET;
      const incidentId = parseInt(c.req.param('id') ?? '', 10);

      if (isNaN(incidentId)) {
        return c.json({ error: 'Invalid incident ID' }, 400);
      }

      const files = c.get('uploadedFiles') as ParsedFile[];
      if (!files || files.length === 0) {
        return c.json({ error: 'No files uploaded' }, 400);
      }

      const userId = c.get('user')?.id;
      const evidence = await evidenceService.addEvidence(db, bucket, files, incidentId, userId);
      return c.json({ message: 'Evidence uploaded', evidence }, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }

  async download(c: Context): Promise<Response> {
    try {
      const db = createDbClient(c.env.DATABASE_URL);
      const bucket = c.env.EVIDENCE_BUCKET;
      const incidentId = parseInt(c.req.param('id') ?? '', 10);
      const evidenceId = parseInt(c.req.param('evidenceId') ?? '', 10);

      if (isNaN(incidentId) || isNaN(evidenceId)) {
        return c.json({ error: 'Invalid ID' }, 400);
      }

      const evidence = await evidenceService.getEvidenceById(db, evidenceId);
      if (!evidence || evidence.incident_id !== incidentId) {
        return c.json({ error: 'Evidence not found' }, 404);
      }

      const incident = await incidentRepository.findById(db, incidentId);
      if (!incident) return c.json({ error: 'Incident not found' }, 404);

      const userId = c.get('user')?.id;
      if (!userId) return c.json({ error: 'Authentication required to download evidence' }, 403);

      const object = await evidenceService.getEvidenceStream(bucket, evidence.file_path);
      if (!object) return c.json({ error: 'File not found in storage' }, 404);

      return new Response(object.body, {
        headers: {
          'Content-Type': evidence.mime_type,
          'Content-Disposition': `attachment; filename="${evidence.original_name}"`,
          'Content-Length': String(evidence.file_size),
        },
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }
}

export default new EvidenceController();
