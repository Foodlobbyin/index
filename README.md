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

- **Node.js** (v16 or higher)
- **Docker** and **Docker Compose**
- **npm** (comes with Node.js)

### Option 1: Automated Start (Recommended)

The easiest way to get started is using the automated start script:

**On Windows:**
```bash
start.bat
```

**On Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

The script will automatically:
1. ✅ Check prerequisites (Docker, Node.js)
2. ✅ Install all dependencies
3. ✅ Start Docker containers
4. ✅ Initialize the database
5. ✅ Start backend and frontend servers
6. ✅ Open your browser to http://localhost:3000

If any step fails, you'll see a clear error message with troubleshooting instructions.

### Option 2: Manual Setup

For more control, you can set up each component manually:

#### Install Dependencies

**Important:** This project uses npm workspaces. You only need to install dependencies from the project root:

```bash
# Install all dependencies (root, backend, and frontend)
npm install
```

This single command will install dependencies for the entire monorepo. You don't need to run `npm install` in the backend or frontend directories separately.

If you see errors like `'nodemon' is not recognized` or `'vite' is not recognized`, it means dependencies are not installed. Run `npm install` from the project root to fix this.

#### Start Services

```bash
# Terminal 1: Start Docker infrastructure
cd infrastructure
docker-compose up -d
cd ..

# Terminal 2: Start backend (from project root)
npm run dev --workspace=backend

# Terminal 3: Start frontend (from project root)
npm run dev --workspace=frontend
```

**Note:** Always run dev commands from the project root using the `--workspace` flag. This ensures the commands can find all dependencies installed in the root `node_modules`.

For detailed manual setup instructions, see [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md).

### Services URLs

After starting the stack, access these services:

- **Backend API**: http://localhost:5000/api
- **API Documentation (Swagger)**: http://localhost:5000/api-docs
- **API Health Check**: http://localhost:5000/api/health
- **pgAdmin**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin
- **PostgreSQL**: localhost:5432
  - User: postgres
  - Password: password
  - Database: foodlobbyin

## 📚 API Documentation (Swagger/OpenAPI)

Foodlobbyin includes comprehensive interactive API documentation powered by Swagger UI:

**Access Swagger UI**: http://localhost:5000/api-docs

### Features

- 🔍 **Interactive API Explorer** - Browse and test all 30+ API endpoints
- 🔐 **JWT Authentication** - Built-in token management with "Authorize" button
- 📝 **Request/Response Examples** - Complete with validation rules
- 🎯 **Try It Out** - Test APIs directly from your browser
- 📊 **Schema Definitions** - Detailed models for all data structures
- 🏷️ **Organized by Tags** - Authentication, Company, Invoices, Insights, Referrals

### Available Endpoints

- **Authentication** (8 endpoints) - Registration, login, email verification, password reset, OTP
- **Secure Auth** (5 endpoints) - Enhanced registration with referral codes and GSTN validation
- **Referrals** (6 endpoints) - Create and manage referral codes
- **Company** (4 endpoints) - CRUD operations for company profiles
- **Invoices** (5 endpoints) - Invoice management and tracking
- **Insights** (1 endpoint) - Aggregated market analytics
- **Health** (1 endpoint) - API health check

### How to Use Swagger UI

1. **Browse Endpoints**: Expand any section to see available endpoints
2. **Authenticate**:
   - Register or login to get a JWT token
   - Click the 🔒 "Authorize" button at top right
   - Enter: `Bearer YOUR_JWT_TOKEN`
   - Click "Authorize"
3. **Test Endpoints**:
   - Click on any endpoint to expand
   - Click "Try it out"
   - Fill in required parameters/body
   - Click "Execute"
   - View response with status code and data

### Export OpenAPI Specification

Get the raw OpenAPI 3.0 JSON specification:
```bash
curl http://localhost:5000/api-docs.json > api-spec.json
```

Use this spec to:
- Generate API clients (TypeScript, Python, Java, etc.)
- Import into Postman or Insomnia
- Generate documentation in other formats
- Set up API testing frameworks

## 🔐 Authentication Features

Foodlobbyin includes comprehensive authentication features:

- ✅ **Email Verification** - Automatic verification emails sent on registration
- ✅ **Password Reset** - Secure email-based password recovery
- ✅ **Email OTP Login** - Alternative authentication using One-Time Passwords
- ✅ **Mobile Number ID** - Mobile number as unique user identifier

### Quick Authentication Guide

**Registration**: Users provide username, mobile number, email, and optional password.

**Login Options**:
1. **Password Login**: Traditional username + password
2. **Email OTP Login**: Email + 6-digit OTP (perfect for forgotten passwords)

**Password Recovery**: Click "Forgot Password?" → Enter email → Follow reset link

📖 **Complete Guide**: See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed documentation.

### Email Configuration

To enable email features, configure these environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@foodlobbyin.com
FRONTEND_URL=http://localhost:3000
```

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
