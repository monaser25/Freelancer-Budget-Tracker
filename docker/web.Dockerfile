FROM node:18-alpine

WORKDIR /app

# Copy root config and package files
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci --workspaces

# Copy web source
COPY apps/web/ ./apps/web/

# Build Web
RUN cd apps/web && npm run build

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/web"]
