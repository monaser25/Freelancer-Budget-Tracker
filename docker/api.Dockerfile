FROM node:18-alpine

WORKDIR /app

# Copy root config and package files
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci --workspaces

# Copy API source
COPY apps/api/ ./apps/api/

# Generate Prisma
RUN cd apps/api && npx prisma generate

# Build API
RUN cd apps/api && npm run build

EXPOSE 4000

CMD ["npm", "run", "start", "-w", "apps/api"]
