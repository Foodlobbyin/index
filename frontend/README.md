# Foodlobbyin Frontend

A React-based frontend application for the Foodlobbyin B2B Market Insights Platform.

## Features

- **User Authentication**: Login and registration with JWT token-based authentication
- **Company Profile Management**: Create and edit company profiles with industry details
- **Invoice Management**: Add, edit, view, and delete invoices with status tracking
- **Market Insights**: View aggregated industry benchmarks and market data
- **Protected Routes**: Secure routes that require authentication
- **Responsive UI**: Clean and functional interface with inline styles

## Tech Stack

- React 18.2.0
- React Router DOM 6.16.0
- TypeScript
- Vite (build tool)
- Axios (HTTP client)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Common layout wrapper with navigation
│   │   ├── Navigation.tsx      # Navigation bar with links
│   │   └── ProtectedRoute.tsx  # HOC for protecting routes
│   ├── pages/
│   │   ├── LoginPage.tsx       # User login page
│   │   ├── RegisterPage.tsx    # User registration page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── CompanyProfile.tsx  # Company profile form
│   │   ├── InvoiceList.tsx     # Invoice management
│   │   └── InsightsPage.tsx    # Market insights display
│   ├── services/
│   │   ├── api.ts              # Axios instance configuration
│   │   ├── authService.ts      # Authentication API calls
│   │   ├── companyService.ts   # Company API calls
│   │   └── invoiceService.ts   # Invoice API calls
│   ├── App.tsx                 # Main app with routing
│   └── index.tsx               # Entry point
├── index.html
├── package.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
cp .env.example .env
```

Edit `.env` to configure the API URL:
```
VITE_API_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## Routes

### Public Routes
- `/login` - User login page
- `/register` - User registration page

### Protected Routes (require authentication)
- `/` - Dashboard (main page after login)
- `/company` - Company profile management
- `/invoices` - Invoice list and management
- `/insights` - Market insights and analytics

## Authentication

The application uses JWT token-based authentication:
- Tokens are stored in `localStorage`
- The API interceptor automatically adds the token to requests
- Unauthorized requests (401) automatically redirect to login
- Use the `authService.logout()` method to clear authentication

## API Integration

The frontend connects to the backend API at the URL specified in `VITE_API_URL` environment variable (defaults to `http://localhost:5000/api`).

All API calls are made through service files in `src/services/`:
- `authService.ts` - Authentication endpoints
- `companyService.ts` - Company CRUD operations
- `invoiceService.ts` - Invoice CRUD and insights

## Error Handling

- All forms include error states for API failures
- Loading states prevent duplicate submissions
- User-friendly error messages are displayed
- Network errors and unauthorized access are handled gracefully

## Components Overview

### ProtectedRoute
Wraps protected pages and redirects to login if user is not authenticated.

### Layout
Provides consistent layout with navigation bar for all protected pages.

### Navigation
Displays app navigation links and logout button.

## Pages Overview

### LoginPage
- Username and password fields
- Error handling
- Link to registration page

### RegisterPage
- Username, email, password, first name, and last name fields
- Creates account and automatically logs in
- Link to login page

### Dashboard
- Welcome message
- Quick links to all main features
- Visual cards for navigation

### CompanyProfile
- Create or edit company profile
- Fields: company name, industry, revenue, employees, address, city, country, website
- Success/error feedback

### InvoiceList
- View all invoices in a table
- Add new invoices with a form
- Edit existing invoices
- Delete invoices with confirmation
- Status badges (pending, paid, overdue, cancelled)
- Sortable and filterable

### InsightsPage
- View market insights by industry
- Filter by specific industry
- Display aggregated statistics
- Show industry breakdown in table format
- Helpful information about data calculations

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright © 2024 Foodlobbyin
