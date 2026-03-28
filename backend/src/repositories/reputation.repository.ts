import pool from '../config/database';

class ReputationRepository {

  // ─── GSTN PATH ────────────────────────────────────────────────────────────

  /**
   * Aggregate incident counts for a GSTN-registered company.
   * Used when per-incident dates are not needed (e.g. simple scoring).
   */
  async getIncidentCountsByGstn(
    gstn: string
  ): Promise<{ incident_type: string; count: number }[]> {
    const result = await pool.query(
      `SELECT incident_type, COUNT(*)::int AS count
       FROM incidents
       WHERE company_gstn = $1
         AND status IN ('approved', 'resolved')
         AND (is_deleted IS NULL OR is_deleted = FALSE)
       GROUP BY incident_type`,
      [gstn]
    );
    return result.rows;
  }

  /**
   * Per-incident rows with dates — used for recency-decay score calculation.
   */
  async getIncidentsWithDatesByGstn(
    gstn: string
  ): Promise<{ incident_type: string; created_at: Date }[]> {
    const result = await pool.query(
      `SELECT incident_type, created_at
       FROM incidents
       WHERE company_gstn = $1
         AND status IN ('approved', 'resolved')
         AND (is_deleted IS NULL OR is_deleted = FALSE)
       ORDER BY created_at DESC`,
      [gstn]
    );
    return result.rows;
  }

  /** Most recent company name recorded against this GSTN. */
  async getCompanyNameByGstn(gstn: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT company_name FROM incidents
       WHERE company_gstn = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [gstn]
    );
    return result.rows[0]?.company_name ?? null;
  }

  /** Stored score from company_profiles (if the company has a profile row). */
  async getStoredScoreByGstn(gstn: string): Promise<number | null> {
    const result = await pool.query(
      `SELECT cp.reputation_score
       FROM company_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE u.gstn = $1
       LIMIT 1`,
      [gstn]
    );
    return result.rows[0]?.reputation_score ?? null;
  }

  async updateScoreByGstn(gstn: string, score: number): Promise<void> {
    await pool.query(
      `UPDATE company_profiles
       SET reputation_score = $1
       WHERE user_id = (SELECT id FROM users WHERE gstn = $2)`,
      [score, gstn]
    );
  }

  // ─── MOBILE / PHONE PATH ──────────────────────────────────────────────────

  /**
   * Given a mobile/phone number, return all distinct company names linked to
   * that number via the contact_persons table.
   * Works for both GSTN-registered and unregistered firms — the company
   * column in contact_persons is a plain name string.
   */
  async getCompanyNamesByPhone(
    phone: string
  ): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT company
       FROM contact_persons
       WHERE phone = $1
         AND company IS NOT NULL
         AND company <> ''
       ORDER BY company`,
      [phone]
    );
    return result.rows.map((r: { company: string }) => r.company);
  }

  /**
   * Per-incident rows (type + date) for a given company name.
   * This is the second step after resolving a phone → company name.
   * Matches on company_name (case-insensitive) across both GSTN and non-GSTN
   * incidents so that a firm with a GSTN is also found via mobile lookup.
   */
  async getIncidentsWithDatesByCompanyName(
    companyName: string
  ): Promise<{ incident_type: string; created_at: Date; company_gstn: string | null }[]> {
    const result = await pool.query(
      `SELECT incident_type, created_at, company_gstn
       FROM incidents
       WHERE LOWER(company_name) = LOWER($1)
         AND status IN ('approved', 'resolved')
         AND (is_deleted IS NULL OR is_deleted = FALSE)
       ORDER BY created_at DESC`,
      [companyName]
    );
    return result.rows;
  }

  /**
   * Also checks users table — a user may have registered with a mobile_number
   * or phone_number and linked it to their company profile.
   * Returns the company name from company_profiles if found.
   */
  async getCompanyNameByUserPhone(phone: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT cp.company_name
       FROM company_profiles cp
       JOIN users u ON cp.user_id = u.id
       WHERE u.mobile_number = $1 OR u.phone_number = $1
       LIMIT 1`,
      [phone]
    );
    return result.rows[0]?.company_name ?? null;
  }
}

export default new ReputationRepository();
