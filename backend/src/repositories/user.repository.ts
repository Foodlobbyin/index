import pool from '../config/database';
import { User, UserCreateInput, UserResponse } from '../models/User';

export interface UserCreateData {
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
}

export class UserRepository {
  async create(user: UserCreateData): Promise<UserResponse> {
    const { username, email, password_hash, first_name, last_name } = user;
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, email, first_name, last_name, created_at`,
      [username, email, password_hash, first_name, last_name]
    );
    return result.rows[0];
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<UserResponse | null> {
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}

export default new UserRepository();
