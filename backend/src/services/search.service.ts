import { contactPersonRepository } from '../repositories/contactPerson.repository';
import { companyRepository } from '../repositories/company.repository';
import pool from '../config/database';

/**
 * SearchService - Handles GSTN and mobile number search with rate limiting
 * Implements Phase 2.3 requirements from IMPLEMENTATION_CHECKLIST.md
 */

interface SearchResult {
  type: 'company' | 'contact';
  id: number;
  company_id?: number;
  company_name?: string;
  gstn?: string;
  mobile_number?: string;
  email?: string;
  incident_count?: number;
}

interface RateLimitInfo {
  remaining: number;
  reset_at: Date;
  limit: number;
}

class SearchService {
  private readonly RATE_LIMIT = 100; // requests per hour
  private readonly RATE_WINDOW = 3600; // 1 hour in seconds

  /**
   * Search companies by GSTN number
   * Returns company details and associated incident count
   */
  async searchByGSTN(gstn: string, userId: number): Promise<SearchResult[]> {
    await this.checkRateLimit(userId);
    await this.logSearch(userId, 'gstn', gstn);

    const companies = await companyRepository.findByGSTN(gstn);
    
    if (!companies || companies.length === 0) {
      return [];
    }

    const results: SearchResult[] = [];
    
    for (const company of companies) {
      // Get incident count for this company
      const incidentCountQuery = `
        SELECT COUNT(*) as count 
        FROM incidents 
        WHERE company_id = $1 AND deleted_at IS NULL
      `;
      const { rows } = await pool.query(incidentCountQuery, [company.company_id]);
      
      results.push({
        type: 'company',
        id: company.company_id,
        company_id: company.company_id,
        company_name: company.company_name,
        gstn: company.gstn,
        incident_count: parseInt(rows[0].count)
      });
    }

    return results;
  }

  /**
   * Search companies and contacts by mobile number
   * Returns both company contact persons and incident reporters
   */
  async searchByMobile(mobile: string, userId: number): Promise<SearchResult[]> {
    await this.checkRateLimit(userId);
    await this.logSearch(userId, 'mobile', mobile);

    const results: SearchResult[] = [];

    // Search contact persons
    const contacts = await contactPersonRepository.findByMobile(mobile);
    
    for (const contact of contacts) {
      results.push({
        type: 'contact',
        id: contact.contact_person_id,
        company_id: contact.company_id,
        company_name: contact.company?.company_name,
        mobile_number: contact.mobile_number,
        email: contact.email
      });
    }

    // Search companies associated with this mobile
    const companies = await contactPersonRepository.findCompaniesByMobile(mobile);
    
    for (const company of companies) {
      // Get incident count
      const incidentCountQuery = `
        SELECT COUNT(*) as count 
        FROM incidents 
        WHERE company_id = $1 AND deleted_at IS NULL
      `;
      const { rows } = await pool.query(incidentCountQuery, [company.company_id]);
      
      results.push({
        type: 'company',
        id: company.company_id,
        company_id: company.company_id,
        company_name: company.company_name,
        gstn: company.gstn,
        incident_count: parseInt(rows[0].count)
      });
    }

    return results;
  }

  /**
   * Check if user has exceeded rate limit
   * Throws error if limit exceeded
   */
  private async checkRateLimit(userId: number): Promise<void> {
    const query = `
      SELECT COUNT(*) as count
      FROM search_logs
      WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '1 hour'
    `;

    const { rows } = await pool.query(query, [userId]);
    const searchCount = parseInt(rows[0].count);

    if (searchCount >= this.RATE_LIMIT) {
      const resetQuery = `
        SELECT MIN(created_at) + INTERVAL '1 hour' as reset_at
        FROM (
          SELECT created_at
          FROM search_logs
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT $2
        ) recent
      `;
      
      const { rows: resetRows } = await pool.query(resetQuery, [userId, this.RATE_LIMIT]);
      
      throw new Error(
        `Rate limit exceeded. ${this.RATE_LIMIT} searches per hour. ` +
        `Resets at ${resetRows[0].reset_at}`
      );
    }
  }

  /**
   * Get current rate limit status for user
   */
  async getRateLimitStatus(userId: number): Promise<RateLimitInfo> {
    const query = `
      SELECT COUNT(*) as count,
             MIN(created_at) + INTERVAL '1 hour' as reset_at
      FROM (
        SELECT created_at
        FROM search_logs
        WHERE user_id = $1
          AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC
        LIMIT $2
      ) recent
    `;

    const { rows } = await pool.query(query, [userId, this.RATE_LIMIT]);
    const searchCount = parseInt(rows[0].count || 0);

    return {
      remaining: Math.max(0, this.RATE_LIMIT - searchCount),
      reset_at: rows[0].reset_at || new Date(Date.now() + this.RATE_WINDOW * 1000),
      limit: this.RATE_LIMIT
    };
  }

  /**
   * Log search query for rate limiting and audit
   */
  private async logSearch(
    userId: number, 
    searchType: 'gstn' | 'mobile', 
    searchValue: string
  ): Promise<void> {
    const query = `
      INSERT INTO search_logs (user_id, search_type, search_value, created_at)
      VALUES ($1, $2, $3, NOW())
    `;

    await pool.query(query, [userId, searchType, searchValue]);
  }

  /**
   * Get search history for user (last 50 searches)
   */
  async getSearchHistory(userId: number, limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        search_type,
        search_value,
        created_at
      FROM search_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
  }
}

export const searchService = new SearchService();
export default searchService;
