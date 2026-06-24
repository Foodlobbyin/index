// Phase 2: filesystem evidence storage will be replaced with Cloudflare R2
// Stub so the bundler does not try to resolve fs

import incidentEvidenceRepository from '../repositories/incidentEvidence.repository';
import type { DbClient } from '../config/database';
import type { IncidentEvidence } from '../models/IncidentEvidence';

export class EvidenceService {
  async addEvidence(_files: any[], _incidentId: number, _uploadedBy?: number): Promise<IncidentEvidence[]> {
    throw new Error('Evidence upload not yet implemented — Phase 2 (R2)');
  }

  async getEvidenceList(db: DbClient, incidentId: number): Promise<IncidentEvidence[]> {
    return incidentEvidenceRepository.findByIncidentId(db, incidentId);
  }

  async getEvidenceById(db: DbClient, id: number): Promise<IncidentEvidence | null> {
    return incidentEvidenceRepository.findById(db, id);
  }

  async deleteEvidence(_db: DbClient, _id: number): Promise<void> {
    throw new Error('Evidence delete not yet implemented — Phase 2 (R2)');
  }
}

export default new EvidenceService();
