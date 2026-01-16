# Build stage
FROM node:20 AS builder

# Set working directory
WORKDIR /app

# Copy package files first (cache dependencies)
COPY package.json yarn.lock* ./

# Install ALL dependencies (including devDependencies for build)
RUN yarn install --frozen-lockfile

# Copy source files and prisma config
COPY . .
COPY prisma.config.ts ./

# Generate Prisma Client
RUN yarn prisma generate

# Build your app
RUN yarn run build

# Production stage
FROM node:20

# Set environment variables
ENV NODE_ENV=production
ARG DATABASE_URL

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install system dependencies
RUN apt-get update && apt-get install -y chromium libreoffice --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Expose port and set environment
EXPOSE 8000
ENV PORT=8000

# Start the app
CMD ["node", "dist/src/main.js"]
