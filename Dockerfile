# ========================================
# Build stage
# ========================================
FROM node:20 AS builder

# Install pnpm
RUN npm install -g pnpm
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN pnpm run build
RUN ls -la /app/dist   # Debug: confirm build produced dist

# ========================================
# Production stage
# ========================================
FROM node:20 AS production

RUN npm install -g pnpm
WORKDIR /app

# Copy package files and install only prod deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy build artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Create logs folder
RUN mkdir -p /app/logs

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main"]
