# Foodlobbyin - B2B Market Insights Platform

A full-stack TypeScript mono-repo application for B2B companies to manage company profiles, invoice data, and view aggregated market insights.

## 🏗️ Project Structure

```
foodlobbyin/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express + TypeScript backend
├── infrastructure/    # Docker, PostgreSQL, migrations
│   ├── db/           # Database schema and seed scripts
│   └── docker-compose.yml
├── package.json       # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **npm** (comes with Node.js)

### One-Command Setup

Run the entire stack with a single command:

```bash
npm run dev:stack:build
```

This will:
- Start PostgreSQL database
- Start the backend API server
- Start pgAdmin (database management UI)

### Services URLs

After starting the stack, access these services:

- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health
- **pgAdmin**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin
- **PostgreSQL**: localhost:5432
  - User: postgres
  - Password: password
  - Database: foodlobbyin

## 📋 Available Scripts

### Root (Monorepo) Scripts

```bash
# Start entire stack with Docker (includes database, API, pgAdmin)
npm run dev:stack

# Start stack and rebuild containers
npm run dev:stack:build

# Stop the Docker stack
npm run dev:stack:down

# Start frontend and backend in development mode (without Docker)
npm run dev

# Build both frontend and backend
npm run build

# Lint and format code
npm run lint
npm run format
```

### Backend Scripts

```bash
cd backend

# Start in development mode with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Frontend Scripts

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🗄️ Database Setup

### Automatic Setup (via Docker)

When you run npm run dev:stack, the database is automatically:
1. Created with the correct schema
2. Available at localhost:5432

### Seed Data

To populate the database with sample data for testing:

```bash
cd infrastructure
docker-compose exec -T db psql -U postgres -d foodlobbyin < db/seed.sql
```

Sample users (password: password123):
- Username: alice_corp
- Username: bob_industries
- Username: carol_solutions

## 📚 API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login and get JWT token
- GET /api/auth/profile - Get current user profile (protected)

### Company Profile
- POST /api/company - Create company profile (protected)
- GET /api/company - Get user's company profile (protected)
- PUT /api/company/:id - Update company profile (protected)
- DELETE /api/company/:id - Delete company profile (protected)

### Invoices
- POST /api/invoices - Create invoice (protected)
- GET /api/invoices - Get all user's invoices (protected)
- GET /api/invoices/:id - Get specific invoice (protected)
- PUT /api/invoices/:id - Update invoice (protected)
- DELETE /api/invoices/:id - Delete invoice (protected)

### Market Insights
- GET /api/insights - Get aggregated market insights
- GET /api/insights?industry=Technology - Filter by industry

## 🛠️ Tech Stack

### Frontend
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool
- React Router - Routing
- Axios - HTTP client

### Backend
- Node.js - Runtime
- Express - Web framework
- TypeScript - Type safety
- PostgreSQL - Database
- bcrypt - Password hashing
- jsonwebtoken - JWT auth
- cors - CORS middleware

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- pgAdmin 4

## 🐛 Troubleshooting

### Docker containers won't start

```bash
npm run dev:stack:down
docker-compose -f infrastructure/docker-compose.yml down -v
npm run dev:stack:build
```

### Database connection failed

Check services are running:
```bash
docker-compose -f infrastructure/docker-compose.yml ps
docker logs foodlobbyin_db
docker logs foodlobbyin_api
```

### TypeScript errors

```bash
rm -rf backend/dist frontend/dist
npm run build
```

## 🧪 Testing

The project has comprehensive test coverage using Jest (backend) and Vitest (frontend).

### Running Tests

#### Run All Tests
```bash
# Run tests for both frontend and backend
npm test
```

#### Backend Tests (Jest)
```bash
cd backend

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### Frontend Tests (Vitest)
```bash
cd frontend

# Run tests once
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

#### Backend Tests (`backend/src/__tests__/`)
- **Unit Tests**: Test individual services, controllers, and repositories
- **Integration Tests**: Test API endpoints with mocked database
- **Test Configuration**: `jest.config.js`
- **Setup File**: `src/setupTests.ts`

Example test locations:
- `__tests__/services/auth.service.test.ts` - Authentication service tests
- `__tests__/services/company.service.test.ts` - Company service tests
- `__tests__/controllers/` - Controller tests (to be added)
- `__tests__/repositories/` - Repository tests (to be added)

#### Frontend Tests (`frontend/src/__tests__/`)
- **Component Tests**: Test React components in isolation
- **Page Tests**: Test complete pages with routing
- **Service Tests**: Test API service functions
- **Test Configuration**: `vitest.config.ts`
- **Setup File**: `src/setupTests.ts`

Example test locations:
- `__tests__/components/Navigation.test.tsx` - Navigation component tests
- `__tests__/components/ProtectedRoute.test.tsx` - Protected route tests
- `__tests__/pages/LoginPage.test.tsx` - Login page tests
- `__tests__/services/authService.test.ts` - Auth service tests

### Writing Tests

#### Backend Test Example (Jest)
```typescript
import authService from '../../services/auth.service';
import userRepository from '../../repositories/user.repository';

jest.mock('../../repositories/user.repository');

describe('AuthService', () => {
  it('should register a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    (userRepository.findByUsername as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue({ id: 1, ...userData });

    const result = await authService.register(userData);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });
});
```

#### Frontend Test Example (Vitest + React Testing Library)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });
});
```

### Test Coverage

Current test coverage goals:
- **Backend**: 50% minimum (aiming for 70%+)
- **Frontend**: 50% minimum (aiming for 70%+)

View detailed coverage reports:
- **Backend**: `backend/coverage/index.html`
- **Frontend**: `frontend/coverage/index.html`

### CI/CD Integration

Tests are run automatically in CI/CD pipeline:
```bash
# Before committing, run tests locally
npm test

# Check test coverage
npm run test:coverage --workspaces
```

### Troubleshooting Tests

**Backend tests fail with database connection errors:**
- Tests use mocked repositories and don't require a real database
- Check that `setupTests.ts` has correct environment variables

**Frontend tests fail with "Cannot find module" errors:**
- Ensure all dependencies are installed: `npm install`
- Clear the cache: `npm run test -- --clearCache`

**Tests timeout:**
- Increase timeout in test configuration
- Backend: `jest.config.js` → `testTimeout: 10000`
- Frontend: `vitest.config.ts` → `testTimeout: 10000`
