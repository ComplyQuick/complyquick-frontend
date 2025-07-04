# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install libc6-compat (optional, useful for some Node modules)
RUN apk add --no-cache libc6-compat

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build the app using .env automatically
FROM node:18-alpine AS builder
WORKDIR /app

# Copy node_modules and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite will automatically pick up `.env` at root
RUN npm run build

# Stage 3: Final container using serve to serve static frontend
FROM node:18-alpine AS final
WORKDIR /app

# Install 'serve'
RUN npm install -g serve

COPY --from=builder /app/dist .

EXPOSE 3000
CMD ["serve", "-s", ".", "-l", "3000"]
