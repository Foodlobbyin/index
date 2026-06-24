import incidentEvidenceRepository from '../repositories/incidentEvidence.repository';
import type { DbClient } from '../config/database';
import type { IncidentEvidence, EvidenceCreateInput } from '../models/IncidentEvidence';
import type { ParsedFile } from '../middleware/upload.middleware';

export class EvidenceService {
  async addEvidence(
    db: DbClient,
    bucket: R2Bucket,
    files: ParsedFile[],
    incidentId: number,
    uploadedBy?: number
  ): Promise<IncidentEvidence[]> {
    const existing = await incidentEvidenceRepository.countByIncidentId(db, incidentId);
    const MAX_FILES = 3;
    if (existing + files.length > MAX_FILES) {
      throw new Error(`Maximum ${MAX_FILES} evidence files allowed per incident`);
    }

    const saved: IncidentEvidence[] = [];
    for (const file of files) {
      const r2Key = `incidents/${incidentId}/${file.filename}`;

      // Upload to R2
      await bucket.put(r2Key, file.bytes, {
        httpMetadata: { contentType: file.mimeType },
        customMetadata: { originalName: file.originalName },
      });

      // Save metadata to DB — store R2 key as file_path
      const data: EvidenceCreateInput = {
        incident_id: incidentId,
        file_name: file.filename,
        original_name: file.originalName,
        file_path: r2Key, // R2 object key
        file_size: file.size,
        mime_type: file.mimeType,
        uploaded_by: uploadedBy,
      };
      const evidence = await incidentEvidenceRepository.create(db, data);
      saved.push(evidence);
    }
    return saved;
  }

  async getEvidenceList(db: DbClient, incidentId: number): Promise<IncidentEvidence[]> {
    return incidentEvidenceRepository.findByIncidentId(db, incidentId);
  }

  async getEvidenceById(db: DbClient, id: number): Promise<IncidentEvidence | null> {
    return incidentEvidenceRepository.findById(db, id);
  }

  async deleteEvidence(db: DbClient, bucket: R2Bucket, id: number): Promise<void> {
    const evidence = await incidentEvidenceRepository.findById(db, id);
    if (!evidence) throw new Error('Evidence not found');
    await bucket.delete(evidence.file_path);
    await incidentEvidenceRepository.delete(db, id);
  }

  async getEvidenceStream(bucket: R2Bucket, r2Key: string): Promise<R2ObjectBody | null> {
    return bucket.get(r2Key);
  }
}

export default new EvidenceService();
