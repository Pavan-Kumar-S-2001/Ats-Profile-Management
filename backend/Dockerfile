FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (including devDependencies needed for prisma generate)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and generate the Prisma client
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Data directory for the SQLite database file (mounted as a volume in compose)
RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 4000

# Push schema to the SQLite DB, seed the admin user (idempotent), then start the server
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node prisma/seed.js && node src/server.js"]
