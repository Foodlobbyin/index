# 🚀 Quick Start Guide - Running Foodlobbyin Locally

This guide will help you run the Foodlobbyin application on your local machine in just a few steps.

## Prerequisites

Before starting, make sure you have:
- ✅ **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- ✅ **Docker Desktop** - Already open (you have this!)
- ✅ **Git** - Already have via GitHub Desktop
- ✅ **Code Editor** - VS Code or any editor

---

## Quick Start Options

You have two options to get started:

### Option A: Automated Start (Recommended for Beginners)

Use the automated start script that handles everything for you:

**On Windows:**
```bash
# Navigate to project directory
cd path\to\your\project

# Run the start script
start.bat
```

**On Mac/Linux:**
```bash
# Navigate to project directory
cd path/to/your/project

# Make script executable (first time only)
chmod +x start.sh

# Run the start script
./start.sh
```

The script will:
1. ✅ Check prerequisites (Docker, Node.js)
2. ✅ Install all dependencies automatically
3. ✅ Start Docker containers
4. ✅ Initialize database
5. ✅ Start backend and frontend servers
6. ✅ Open your browser to http://localhost:3000

If any step fails, the script will show you a clear error message and stop.

### Option B: Manual Setup (For Advanced Users)

If you prefer to set up everything manually, follow the detailed steps below.

---

## Step 1: Open Terminal/Command Prompt

### On Windows:
- Press `Win + R`, type `cmd`, press Enter
- Or use PowerShell or Git Bash

### On Mac:
- Press `Cmd + Space`, type "Terminal", press Enter

### Navigate to Your Project
```bash
cd path/to/your/foodlobbyin/project
# Example: cd C:\Users\YourName\Documents\GitHub\index
```

---

## Step 2: Install Dependencies

**Important:** This project uses npm workspaces, so you only need to run one command:

```bash
# Install all dependencies (root, backend, and frontend)
npm install
```

This single command installs dependencies for the entire monorepo (root, backend, and frontend). You don't need to `cd` into backend or frontend directories.

**Wait for installation to complete** (this might take 2-5 minutes).

**Common Error:** If you see `'nodemon' is not recognized` or `'vite' is not recognized`, it means dependencies are not installed. Run `npm install` from the project root to fix this.

---

## Step 3: Set Up Environment Variables

### Backend Environment
Create a file: `backend/.env`

Copy this content:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foodlobbyin
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=foodlobbyin

# JWT Secret (change this for production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (optional for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@foodlobbyin.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# reCAPTCHA (optional for now)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_THRESHOLD=0.5

# OTP Settings
OTP_EXPIRY_MINUTES=10
MAX_OTP_GENERATION_PER_HOUR=5
MAX_OTP_VERIFICATION_ATTEMPTS=5
```

### Frontend Environment
Create a file: `frontend/.env`

Copy this content:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

---

## Step 4: Start Docker (Database)

### Make sure Docker Desktop is running, then:

```bash
# Start from the root of your project
cd infrastructure

# Start PostgreSQL and pgAdmin
docker-compose up -d
```

**Wait for containers to start** (30-60 seconds).

### Verify Docker is running:
```bash
docker ps
```

You should see containers running for:
- `foodlobbyin-db` (PostgreSQL)
- `foodlobbyin-pgadmin` (pgAdmin)

---

## Step 5: Initialize Database

```bash
# Go back to root
cd ..

# Run database migrations
cd backend
npm run migrate
```

If `npm run migrate` doesn't exist, run this instead:
```bash
# Connect to database and run init script
docker exec -i foodlobbyin-db psql -U postgres -d foodlobbyin < ../infrastructure/db/init.sql
```

---

## Step 6: Start Backend Server

Open a **NEW terminal window** (keep Docker running in the other one).

```bash
# From project root (not from backend directory)
npm run dev --workspace=backend
```

**Alternative:** You can also run from backend directory:
```bash
cd backend
npm run dev
```
But the workspace command from root is recommended.

You should see:
```
✓ Server running on http://localhost:5000
✓ API docs available at http://localhost:5000/api-docs
✓ Database connected
```

**Keep this terminal open!**

---

## Step 7: Start Frontend Application

Open **ANOTHER NEW terminal window**.

```bash
# From project root (not from frontend directory)
npm run dev --workspace=frontend
```

**Alternative:** You can also run from frontend directory:
```bash
cd frontend
npm run dev
```
But the workspace command from root is recommended.

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

**Keep this terminal open too!**

---

## Step 8: Access the Application

### Open your web browser and visit:

1. **Homepage**: http://localhost:3000/
2. **News Page**: http://localhost:3000/news
3. **Login Page**: http://localhost:3000/login
4. **API Documentation**: http://localhost:5000/api-docs
5. **pgAdmin** (Database UI): http://localhost:5050

---

## 🎯 What You Should See

### Homepage (http://localhost:3000/)
- Hero section with "Protecting B2B Vendors"
- Feature cards
- How it works section
- Sign In button (top right)

### Login Page (http://localhost:3000/login)
- Username/Password form
- Email OTP option
- Links to Register and Forgot Password

### API Docs (http://localhost:5000/api-docs)
- Swagger UI with all API endpoints
- Try out features
- Authentication options

---

## 🛠️ Troubleshooting

### Issue: 'nodemon' is not recognized or 'vite' is not recognized

**Error**: `'nodemon' is not recognized as an internal or external command`

**Cause**: Dependencies are not installed.

**Solution**:
```bash
# From the project root directory
npm install
```

This will install all dependencies for the monorepo (root, backend, and frontend). After installation, you can run the dev commands again.

**Note**: This project uses npm workspaces. All dependencies are managed from the root directory. You don't need to install dependencies in backend or frontend directories separately.

### Issue: Port already in use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Issue: Database connection failed

**Solution**:
1. Make sure Docker is running
2. Check containers: `docker ps`
3. Restart containers: `docker-compose restart`

### Issue: npm install fails

**Solution**:
1. Delete `node_modules` folders
2. Delete `package-lock.json` files
3. Run `npm install` again

**Common causes and solutions**:

**Network Issues:**
- Check your internet connection
- If behind a proxy, configure npm:
  ```bash
  npm config set proxy http://proxy.company.com:8080
  npm config set https-proxy http://proxy.company.com:8080
  ```
- Try using a different network or VPN

**npm Cache Corruption:**
- Clear npm cache:
  ```bash
  npm cache clean --force
  npm cache verify
  ```
- Then try installing again

**Permission Issues:**
- On Windows: Run Command Prompt as Administrator
- On Mac/Linux: Fix permissions (avoid using sudo with npm):
  ```bash
  # Fix npm permissions
  sudo chown -R $USER:$GROUP ~/.npm
  sudo chown -R $USER:$GROUP ~/.config
  ```

**Verify npm and Node.js versions:**
```bash
node --version  # Should be v16 or higher
npm --version   # Should be v8 or higher
```

**Try verbose installation to see detailed errors:**
```bash
npm install --verbose
```

### Issue: Frontend won't start

**Solution**:
1. Check if backend is running (should be on port 5000)
2. Clear browser cache
3. Restart frontend: `Ctrl+C` then `npm run dev`

---

## 📋 Daily Development Workflow

### Starting Work:
```bash
# Terminal 1: Start Docker (from infrastructure directory)
cd infrastructure
docker-compose up -d
cd ..

# Terminal 2: Start Backend (from project root)
npm run dev --workspace=backend

# Terminal 3: Start Frontend (from project root)
npm run dev --workspace=frontend
```

### Stopping Work:
```bash
# Press Ctrl+C in backend terminal
# Press Ctrl+C in frontend terminal

# Stop Docker (optional)
cd infrastructure
docker-compose down
```

---

## 🔍 Useful Commands

### Check what's running:
```bash
# Backend
curl http://localhost:5000/api/health

# Frontend
curl http://localhost:3000

# Docker
docker ps
```

### View logs:
```bash
# Docker logs
docker logs foodlobbyin-db
docker logs foodlobbyin-pgadmin

# Backend logs - visible in terminal where npm run dev is running
# Frontend logs - visible in terminal where npm run dev is running
```

### Database access:
```bash
# Via command line
docker exec -it foodlobbyin-db psql -U postgres -d foodlobbyin

# Via pgAdmin
# Open http://localhost:5050
# Email: admin@foodlobbyin.com
# Password: admin
```

---

## 🎨 Testing the Application

### 1. Test Homepage
- Go to http://localhost:3000/
- Click around the feature cards
- Test "Sign In" button (should go to /login)

### 2. Test Login
- Go to http://localhost:3000/login
- Try switching between Password and Email OTP tabs
- (Registration will require referral code - check docs)

### 3. Test API
- Go to http://localhost:5000/api-docs
- Click on any endpoint to expand
- Click "Try it out"
- Execute requests

### 4. Test Database
- Go to http://localhost:5050
- Login with credentials
- Connect to server (add foodlobbyin-db)
- Browse tables

---

## 📝 Next Steps

After getting everything running:

1. **Create a test user** (via API or pgAdmin)
2. **Test authentication flow**
3. **Explore all pages**
4. **Check API documentation**
5. **Try submitting data**
6. **Read DAILY_IMPLEMENTATION_PLAN.md** for development tasks

---

## 🆘 Getting Help

If you're stuck:

1. Check terminal output for error messages
2. Check browser console (F12) for frontend errors
3. Check Docker logs for database issues
4. Review this guide again
5. Ask for help with specific error messages

---

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Docker Desktop running
- [ ] Dependencies installed (npm install)
- [ ] Environment files created (.env)
- [ ] Docker containers running (docker ps)
- [ ] Database initialized
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000/ in browser
- [ ] Can see homepage with features
- [ ] Can access login page
- [ ] Can access API docs at /api-docs

**If all checked ✅ - You're ready to develop!** 🎉

---

**Need help? Check error messages in terminals and browser console (F12).**
