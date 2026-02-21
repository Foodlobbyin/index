import fs from 'fs';
import incidentEvidenceRepository from '../repositories/incidentEvidence.repository';
import { IncidentEvidence, EvidenceCreateInput } from '../models/IncidentEvidence';

const MAX_FILES = parseInt(process.env.MAX_FILES_PER_INCIDENT || '3', 10);

export class EvidenceService {
  async addEvidence(
    files: Express.Multer.File[],
    incidentId: number,
    uploadedBy?: number
  ): Promise<IncidentEvidence[]> {
    const existing = await incidentEvidenceRepository.countByIncidentId(incidentId);
    if (existing + files.length > MAX_FILES) {
      // Clean up uploaded files
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      throw new Error(`Maximum ${MAX_FILES} evidence files allowed per incident`);
    }

    const saved: IncidentEvidence[] = [];
    for (const file of files) {
      const data: EvidenceCreateInput = {
        incident_id: incidentId,
        file_name: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: uploadedBy,
      };
      const evidence = await incidentEvidenceRepository.create(data);
      saved.push(evidence);
    }
    return saved;
  }

  async getEvidenceList(incidentId: number): Promise<IncidentEvidence[]> {
    return incidentEvidenceRepository.findByIncidentId(incidentId);
  }

  async getEvidenceById(id: number): Promise<IncidentEvidence | null> {
    return incidentEvidenceRepository.findById(id);
  }

  async deleteEvidence(id: number): Promise<void> {
    const evidence = await incidentEvidenceRepository.findById(id);
    if (!evidence) throw new Error('Evidence not found');

    if (fs.existsSync(evidence.file_path)) {
      fs.unlinkSync(evidence.file_path);
    }
    await incidentEvidenceRepository.delete(id);
  }
}

export default new EvidenceService();
