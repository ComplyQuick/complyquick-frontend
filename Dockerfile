# # Multi-stage build for production optimization
# FROM node:18-alpine AS base

# # Install dependencies only when needed
# FROM base AS deps
# # Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# RUN apk add --no-cache libc6-compat
# WORKDIR /app

# # Install dependencies based on the preferred package manager
# COPY package.json package-lock.json* ./
# RUN npm ci

# # Rebuild the source code only when needed
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Build the application
# RUN npm run build

# # Production image, copy all the files and run the app
# FROM nginx:alpine AS runner
# WORKDIR /app

# # Create a non-root user
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# # Copy the built application
# COPY --from=builder /app/dist /app/dist

# # Copy nginx configuration
# COPY nginx.conf /etc/nginx/nginx.conf

# # Set proper permissions
# # RUN chown -R nextjs:nodejs /app
# # USER nextjs

# EXPOSE 3000

# ENV PORT 3000
# ENV HOSTNAME "0.0.0.0"

# # Start nginx
# CMD ["nginx", "-g", "daemon off;"] 



# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# libc6-compat might be required by some dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declare build arguments for environment variables
ARG VITE_BACKEND_URL
ARG VITE_AI_SERVICE_URL

ARG VITE_GOOGLE_DRIVE_CLIENT_ID
ARG VITE_GOOGLE_DRIVE_CLIENT_SECRET
ARG VITE_GOOGLE_DRIVE_REDIRECT_URI
ARG VITE_GOOGLE_DRIVE_REFRESH_TOKEN
ARG VITE_GOOGLE_DRIVE_FOLDER_ID

# Set environment variables for the build (used by Vite)
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_AI_SERVICE_URL=$VITE_AI_SERVICE_URL

ENV VITE_GOOGLE_DRIVE_CLIENT_ID=$VITE_GOOGLE_DRIVE_CLIENT_ID
ENV VITE_GOOGLE_DRIVE_CLIENT_SECRET=$VITE_GOOGLE_DRIVE_CLIENT_SECRET
ENV VITE_GOOGLE_DRIVE_REDIRECT_URI=$VITE_GOOGLE_DRIVE_REDIRECT_URI
ENV VITE_GOOGLE_DRIVE_REFRESH_TOKEN=$VITE_GOOGLE_DRIVE_REFRESH_TOKEN
ENV VITE_GOOGLE_DRIVE_FOLDER_ID=$VITE_GOOGLE_DRIVE_FOLDER_ID

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM nginx:alpine AS runner
WORKDIR /app

# Create a non-root user (optional)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port and set environment
EXPOSE 80
ENV PORT 80
ENV HOSTNAME "0.0.0.0"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]