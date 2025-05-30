# Quick Comply Academy

A comprehensive learning management system (LMS) platform for compliance training and education.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Authentication Setup](#authentication-setup)
- [Google Drive Integration](#google-drive-integration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (v9 or higher)
- Python (v3.11 or higher)
- PostgreSQL (v14 or higher)
- Git
- Google Cloud Platform account
- Google Drive API credentials

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/quick-comply-academy.git
cd quick-comply-academy
```

2. Create environment files:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. Install global dependencies:
```bash
npm install -g typescript
npm install -g ts-node
```

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/quick_comply

# JWT
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# Server
PORT=8000
CORS_ORIGINS=http://localhost:5173
```

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Database Setup

1. Create PostgreSQL database:
```bash
createdb quick_comply
```

2. Run migrations:
```bash
cd backend
alembic upgrade head
```

3. Seed initial data (if needed):
```bash
python scripts/seed_data.py
```

## Authentication Setup

1. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback`
     - `http://localhost:5173/auth/callback`

2. Configure JWT:
   - Generate a secure JWT secret
   - Update `JWT_SECRET` in backend/.env

## Google Drive Integration

1. Enable Google Drive API:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google Drive API
   - Create service account
   - Download credentials JSON file

2. Configure Google Drive:
   - Place credentials file in `backend/credentials/`
   - Update `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` in backend/.env

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Project Structure

```
quick-comply-academy/
├── backend/
│   ├── alembic/              # Database migrations
│   │   ├── api/             # API endpoints
│   │   ├── core/            # Core functionality
│   │   ├── models/          # Database models
│   │   └── services/        # Business logic
│   ├── credentials/         # Google Drive credentials
│   ├── tests/               # Backend tests
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/              # Static assets
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Frontend tests
│   └── package.json        # Node dependencies
└── README.md               # Project documentation
```

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the backend server is running. It includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## Troubleshooting

Common issues and solutions:

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists and user has permissions

2. **Google Drive Integration Issues**
   - Verify credentials file exists
   - Check Google Drive API is enabled
   - Ensure refresh token is valid

3. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check for version conflicts
   - Verify environment variables

4. **Authentication Issues**
   - Verify JWT secret
   - Check token expiration
   - Ensure CORS is properly configured

For additional support, please contact the development team or create an issue in the repository.
