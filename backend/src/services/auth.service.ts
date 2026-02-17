import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/user.repository';
import { UserCreateInput, UserLoginInput, UserResponse } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export class AuthService {
  async register(userData: UserCreateInput): Promise<{ user: UserResponse; token: string }> {
    // Check if user already exists
    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      username: userData.username,
      email: userData.email,
      password_hash,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return { user, token };
  }

  async login(credentials: UserLoginInput): Promise<{ user: UserResponse; token: string }> {
    // Find user
    const user = await userRepository.findByUsername(credentials.username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user without password
    const { password_hash, ...userResponse } = user;
    return { user: userResponse as UserResponse, token };
  }

  async getUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();
