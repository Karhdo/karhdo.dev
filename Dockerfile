# Stage 1: Dependencies
FROM node:24-alpine AS deps

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma config and schema for generation
COPY prisma.config.ts ./
COPY prisma ./prisma

# Copy scripts needed for postgenerate
COPY scripts ./scripts

# Set dummy database URL for Prisma config (not used during generate, but config needs to load)
ENV POSTGRES_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:24-alpine AS builder

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV POSTGRES_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client (will run automatically via postinstall, but ensure it's done)
RUN pnpm prisma:generate

# Build the application (contentlayer2 build && next build)
RUN pnpm build

# Stage 3: Runner
FROM node:24-alpine AS runner

WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy contentlayer generated content
COPY --from=builder --chown=nextjs:nodejs /app/.contentlayer ./.contentlayer

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application using standalone server
CMD ["node", "server.js"]
