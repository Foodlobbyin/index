/**
 * ContactPerson — matches the actual `contact_persons` table schema
 * created in migration 003_add_incidents_schema.sql.
 *
 * Table columns: id, name, email, phone, company, created_at
 *
 * NOTE: `company` is a plain name string (no GSTN). A contact person can be
 * associated with a firm that has no GSTN number (unregistered / sole trader).
 */
export interface ContactPerson {
  id: number;
  name: string;
  email: string;
  phone?: string;         // mobile / phone number
  company?: string;       // company / firm name (nullable — GSTN-less firms included)
  created_at: Date;
}

export interface ContactPersonCreateInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}
