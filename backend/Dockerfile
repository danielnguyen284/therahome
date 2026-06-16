# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files
COPY . .

# Prune dev dependencies for production image
RUN npm prune --omit=dev

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built node_modules (with prisma client and prod dependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/config ./config
COPY --from=builder /app/imports ./imports
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils

# Port the backend runs on (default is 5001)
EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.js"]
