// Setup file for Jest tests
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'foodlobbyin_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
