# Stage 1: Builder

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma

RUN npm ci

COPY src ./src

RUN npm run build

RUN npx prisma generate

# Stage 2: Runtime

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy prisma schema TRƯỚC khi cài dependencies
COPY prisma ./prisma
COPY package*.json ./

# Install production dependencies với --ignore-scripts để bỏ qua postinstall
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

EXPOSE 3301

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3301/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to run the application
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]