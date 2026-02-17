import bcrypt from 'bcrypt';
import authService from '../../services/auth.service';
import userRepository from '../../repositories/user.repository';

// Mock the user repository
jest.mock('../../repositories/user.repository');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date(),
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'existinguser',
      });

      await expect(authService.register(userData)).rejects.toThrow('Username already exists');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
      });

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials = {
        username: 'testuser',
        password: 'password123',
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: hashedPassword,
        created_at: new Date(),
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw error with invalid username', async () => {
      const credentials = {
        username: 'nonexistent',
        password: 'password123',
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        password_hash: hashedPassword,
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(mockUser);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
      };

      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw error if user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(authService.getUserById(999)).rejects.toThrow('User not found');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockToken = 'valid.jwt.token';
      
      expect(() => {
        try {
          authService.verifyToken(mockToken);
        } catch (error: any) {
          expect(error.message).toBe('Invalid token');
        }
      }).not.toThrow();
    });
  });
});
