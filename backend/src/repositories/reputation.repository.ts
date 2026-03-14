import pool from '../config/database';

class ReputationRepository {
  async getIncidentCountsByGstn(gstn: string): Promise<{ incident_type: string; count: number }[]> {
    const result = await pool.query(
      `SELECT incident_type, COUNT(*)::int as count
       FROM incidents
       WHERE company_gstn = $1 AND status IN ('approved', 'resolved')
       GROUP BY incident_type`,
      [gstn]
    );
    return result.rows;
  }

  async getCompanyNameByGstn(gstn: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT company_name FROM incidents WHERE company_gstn = $1 LIMIT 1`,
      [gstn]
    );
    return result.rows.length > 0 ? result.rows[0].company_name : null;
  }

  async getStoredScoreByGstn(gstn: string): Promise<number | null> {
    const result = await pool.query(
      `SELECT cp.reputation_score
       FROM company_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE u.gstn = $1
       LIMIT 1`,
      [gstn]
    );
    return result.rows.length > 0 ? result.rows[0].reputation_score : null;
  }

  async updateScoreByGstn(gstn: string, score: number): Promise<void> {
    await pool.query(
      `UPDATE company_profiles SET reputation_score = $1
       WHERE user_id = (SELECT id FROM users WHERE gstn = $2)`,
      [score, gstn]
    );
  }
}

export default new ReputationRepository();
