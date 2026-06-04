FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY apps/web/ ./apps/web/

ARG DATABASE_URL="postgresql://postgres:password@localhost:5432/flowledger"
ARG DIRECT_URL="postgresql://postgres:password@localhost:5432/flowledger"
ARG SUPABASE_URL=""
ARG SUPABASE_SERVICE_ROLE_KEY=""
ARG NEXT_PUBLIC_SUPABASE_URL=""
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ARG NEXT_PUBLIC_API_URL=""

ENV DATABASE_URL=$DATABASE_URL \
    DIRECT_URL=$DIRECT_URL \
    SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build -w apps/web

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/web"]
