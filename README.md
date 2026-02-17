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
