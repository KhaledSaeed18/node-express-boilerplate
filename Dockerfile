
# Stage 1: Install dependencies
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# Stage 2: Build
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# No real DB needed at build time — generate only reads the schema file
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/template-db" \
    pnpm prisma:generate

RUN pnpm build


# Stage 3: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Compiled app
COPY --from=builder /app/dist ./dist

# Runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

# Generated Prisma client
COPY --from=builder /app/src/generated ./src/generated

# Prisma schema + migrations folder (needed for migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Prisma config file (needed to specify the location of the schema and generated client)
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Needed by some packages at runtime
COPY package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget -qO- http://localhost:8000/api || exit 1

# Run migrations first, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.ts && node dist/index.js"]