# Testing Guide for Foodlobbyin

This guide provides comprehensive information about testing in the Foodlobbyin project.

## Table of Contents

1. [Overview](#overview)
2. [Test Framework Setup](#test-framework-setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Best Practices](#best-practices)
7. [Common Patterns](#common-patterns)

## Overview

The Foodlobbyin project uses different testing frameworks for backend and frontend:

- **Backend**: Jest with ts-jest for TypeScript support
- **Frontend**: Vitest (Vite's native test runner) with React Testing Library

## Test Framework Setup

### Backend (Jest)

**Configuration**: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageThreshold: { global: { branches: 50, functions: 50, lines: 50, statements: 50 } },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

**Dependencies**:
- `jest`: Test framework
- `ts-jest`: TypeScript preprocessor for Jest
- `@types/jest`: TypeScript types for Jest
- `supertest`: HTTP assertion library for testing APIs

### Frontend (Vitest)

**Configuration**: `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: { provider: 'v8', thresholds: { lines: 50 } },
  },
});
```

**Dependencies**:
- `vitest`: Test framework (Vite-native)
- `@testing-library/react`: React testing utilities
- `@testing-library/jest-dom`: Custom Jest matchers for DOM
- `@testing-library/user-event`: User interaction simulation
- `jsdom`: DOM implementation for Node.js
- `@vitest/ui`: Optional UI for running tests
- `@vitest/coverage-v8`: Code coverage provider

## Running Tests

### All Tests (Monorepo)

```bash
# Run tests for all workspaces
npm test

# Run tests with coverage for all workspaces
npm run test:coverage
```

### Backend Tests

```bash
cd backend

# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### Frontend Tests

```bash
cd frontend

# Run all tests once
npm test

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- LoginPage.test.tsx

# Run tests matching pattern
npm test -- --grep="should render"
```

## Writing Tests

### Backend Test Structure

#### Service Test Example

```typescript
// backend/src/__tests__/services/auth.service.test.ts
import authService from '../../services/auth.service';
import userRepository from '../../repositories/user.repository';

// Mock dependencies
jest.mock('../../repositories/user.repository');

describe('AuthService', () => {
  // Clear mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.username).toBe('testuser');
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should throw error if username already exists', async () => {
      const userData = { username: 'existing', email: 'test@example.com', password: '123' };
      
      (userRepository.findByUsername as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(authService.register(userData)).rejects.toThrow('Username already exists');
    });
  });
});
```

#### Controller Test Example (with Supertest)

```typescript
// backend/src/__tests__/controllers/auth.controller.test.ts
import request from 'supertest';
import app from '../../index';
import authService from '../../services/auth.service';

jest.mock('../../services/auth.service');

describe('AuthController', () => {
  describe('POST /api/auth/register', () => {
    it('should register user successfully', async () => {
      const mockResponse = {
        user: { id: 1, username: 'test', email: 'test@example.com' },
        token: 'mock-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockResponse);
    });
  });
});
```

### Frontend Test Structure

#### Component Test Example

```typescript
// frontend/src/__tests__/components/Navigation.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import { authService } from '../../services/authService';

vi.mock('../../services/authService');

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });

  it('should call logout when button clicked', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(authService.logout).toHaveBeenCalled();
  });
});
```

#### Page Test Example

```typescript
// frontend/src/__tests__/pages/LoginPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { authService } from '../../services/authService';

vi.mock('../../services/authService');

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    (authService.login as any).mockResolvedValue({
      user: { id: 1, username: 'test' },
      token: 'token',
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByPlaceholderText(/username/i), 'testuser');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  });
});
```

## Test Coverage

### Viewing Coverage Reports

After running tests with coverage, view detailed HTML reports:

```bash
# Backend coverage report
open backend/coverage/index.html

# Frontend coverage report
open frontend/coverage/index.html
```

### Coverage Thresholds

Current thresholds are set at 50% to allow incremental improvement:

- **Statements**: 50%
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%

### Improving Coverage

1. Identify uncovered code in coverage reports
2. Write tests for critical paths first (auth, CRUD operations)
3. Add edge case tests
4. Test error handling paths
5. Gradually increase thresholds

## Best Practices

### General

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Keep tests focused
3. **Descriptive Test Names**: Use "should X when Y" format
4. **Test Behavior, Not Implementation**: Focus on outputs, not internals
5. **Mock External Dependencies**: Isolate unit under test
6. **Clean Up After Tests**: Use `beforeEach`/`afterEach` hooks

### Backend-Specific

1. **Mock Database Calls**: Don't hit real database in unit tests
2. **Test Error Cases**: Test both success and failure paths
3. **Use Supertest for API Tests**: Test HTTP endpoints
4. **Mock External Services**: Mock JWT, bcrypt, email services, etc.
5. **Test Middleware**: Test auth, validation, error handling

### Frontend-Specific

1. **Wrap with Router**: Always wrap components that use routing
2. **Use `screen` queries**: `screen.getByText()` over `container.querySelector()`
3. **Test User Interactions**: Use `fireEvent` or `@testing-library/user-event`
4. **Async Assertions**: Use `waitFor` for async operations
5. **Mock API Calls**: Mock axios/fetch to avoid network requests
6. **Test Accessibility**: Use semantic queries (`getByRole`, `getByLabelText`)

## Common Patterns

### Mocking localStorage

```typescript
// Frontend
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
```

### Mocking Async Functions

```typescript
// Jest
(someFunction as jest.Mock).mockResolvedValue({ data: 'mock' });
(someFunction as jest.Mock).mockRejectedValue(new Error('error'));

// Vitest
vi.mocked(someFunction).mockResolvedValue({ data: 'mock' });
vi.mocked(someFunction).mockRejectedValue(new Error('error'));
```

### Testing Protected Routes

```typescript
it('should redirect to login when not authenticated', () => {
  (authService.isAuthenticated as any).mockReturnValue(false);

  render(
    <BrowserRouter>
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    </BrowserRouter>
  );

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
});
```

### Testing Form Validation

```typescript
it('should show error when fields are empty', async () => {
  render(<LoginPage />);
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

**"Cannot find module" errors**:
```bash
npm install
npm run test -- --clearCache
```

**Tests timeout**:
```javascript
// jest.config.js
module.exports = {
  testTimeout: 10000,
  // ...
};
```

**Mock not working**:
- Ensure mock is defined before import
- Use `jest.clearAllMocks()` in `beforeEach`
- Check mock path matches actual import path

**React Testing Library errors**:
- Always wrap with `<BrowserRouter>` if component uses routing
- Use `await waitFor()` for async operations
- Use `screen.debug()` to see current DOM

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
