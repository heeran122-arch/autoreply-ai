# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# copy package.json first for caching
COPY package.json package-lock.json* ./
RUN npm ci --production=false

COPY . .

# generate prisma client
RUN npx prisma generate

# build
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./package.json

EXPOSE 3000

# Run migrations (non-interactive) and start the server
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]
