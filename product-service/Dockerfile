# Stage 1: Build the NestJS app
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Run the NestJS app in a clean production environment
FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
# Copy firebase config if it exists
COPY --from=builder /app/firebase-service-account.json* ./

CMD ["node", "dist/main.js"]
