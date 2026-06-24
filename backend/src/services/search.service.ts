import type { DbClient } from '../config/database';

/**
 * SearchService — rate-limited search logging.
 *
 * Actual incident/reputation search logic lives in:
 *   - incidentService (incident search by GSTN / company name)
 *   - reputationService (reputation by GSTN / phone)
 *
 * This service handles only rate-limit checking and search audit logging.
 */

const RATE_LIMIT = 100;  // max searches per hour per user

export class SearchService {
  /**
   * Check whether the user has exceeded their hourly search quota.
   * Throws HTTP-like error if exceeded.
   */
  async checkRateLimit(db: DbClient, userId: number): Promise<void> {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM search_logs
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );

    if (rows[0].count >= RATE_LIMIT) {
      throw Object.assign(
        new Error(`Search rate limit reached (${RATE_LIMIT}/hour). Try again later.`),
        { statusCode: 429 }
      );
    }
  }

  /**
   * Log a search action for audit and rate-limiting purposes.
   */
  async logSearch(
    db: DbClient,
    userId: number,
    searchType: 'gstn' | 'mobile',
    searchValue: string
  ): Promise<void> {
    await db.query(
      `INSERT INTO search_logs (user_id, search_type, search_value, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, searchType, searchValue]
    );
  }

  /**
   * Return how many searches the user has remaining this hour.
   */
  async getRateLimitStatus(
    db: DbClient,
    userId: number
  ): Promise<{ remaining: number; limit: number }> {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM search_logs
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );
    return {
      remaining: Math.max(0, RATE_LIMIT - (rows[0].count as number)),
      limit: RATE_LIMIT,
    };
  }
}

export const searchService = new SearchService();
export default searchService;
