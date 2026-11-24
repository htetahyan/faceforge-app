# ==============================================================================
# GLOWUP AI - PRODUCTION DOCKERFILE (BUN + HONO + DRIZZLE)
# ==============================================================================

# Use official Bun alpine image for lightweight production container
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Stage 1: Install production dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 2: Install dev dependencies for type-checking / migrations if needed
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# Stage 3: Release production container
FROM base AS release
ENV NODE_ENV=production
ENV PORT=3005

# Copy production node_modules & source files
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose API port
EXPOSE 3005

# Healthcheck to verify Bun service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/ || exit 1

# Launch production server
CMD ["bun", "src/index.ts"]
