# Quick Comply Academy

A comprehensive learning management system (LMS) platform for compliance training and education, built with React, TypeScript, and Vite.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **bun** (v1.0 or higher)
- **Git**
- **Docker** (optional, for containerized deployment)

## Installation

### Local Development

1. **Clone the repository:**

```bash
git clone https://github.com/ComplyQuick/complyquick-frontend
cd quick-comply-academy-2eed76ce
```

2. **Install dependencies:**

```bash
npm install
# or if using bun
bun install
```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with the following variables:

```env
VITE_BACKEND_URL=your_backend_url_here
VITE_AI_SERVICE_URL=your_ai_service_url_here
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_DRIVE_REDIRECT_URI=your_redirect_uri
VITE_GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

4. **Start the development server:**

```bash
npm run dev
# or if using bun
bun dev
```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:7000`

### Docker Deployment

#### Production Build

```bash
# Build and run production container
docker-compose up --build

# Or build manually
docker build -t quick-comply-academy .
docker run -p 3000:3000 quick-comply-academy
```

#### Development with Docker

```bash
# Run development container with hot reload
docker-compose --profile dev up --build

# Or run manually
docker build -f Dockerfile.dev -t quick-comply-academy-dev .
docker run -p 7000:7000 -v $(pwd):/app quick-comply-academy-dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with shadcn/ui components
- **State Management:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** TanStack Query
- **UI Components:** Radix UI primitives
- **Speech Recognition:** Web Speech API (native browser support)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── services/      # API service functions
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── stores/        # State management
```

## Troubleshooting

### Common Issues

1. **Dependency Installation Issues**

   - Clear node_modules and package-lock.json: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

2. **Build Issues**

   - Check for TypeScript errors: `npm run lint`
   - Verify environment variables are set correctly

3. **Speech Recognition Issues**

   - Ensure you're using HTTPS in production (required for Web Speech API)
   - Check browser compatibility (Chrome, Edge, Safari supported)

4. **Google Drive Integration Issues**

   - Verify Google Drive API credentials
   - Check environment variables are properly configured

5. **Docker Issues**
   - Ensure Docker is running
   - Check if ports 3000 or 7000 are available
   - Clear Docker cache: `docker system prune -a`

For additional support, please create an issue in the repository.
