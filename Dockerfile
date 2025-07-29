# Build stage
FROM node:20-alpine AS builder

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install dependencies for Prisma runtime and PostgreSQL client
RUN apk add --no-cache libc6-compat netcat-openbsd

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy package files for scripts
COPY --from=builder /app/package*.json ./

# Install Prisma CLI for migrations
RUN npm install prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Create writable directories and set permissions
RUN chmod +x docker-entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]