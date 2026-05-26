FROM node:20.19.4-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20.19.4-alpine as production
RUN apk add --no-cache postgresql-client
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/src/knexfile.ts ./src/knexfile.ts
COPY --from=builder /app/tsconfig*.json ./

RUN printf '#!/bin/sh\n\
set -e\n\
echo "Waiting for PostgreSQL to be ready..."\n\
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do\n\
  echo "PostgreSQL not ready yet, retrying in 2s..."\n\
  sleep 2\n\
done\n\
echo "PostgreSQL ready. Running migrations..."\n\
npm run migrate:latest\n\
echo "Starting server..."\n\
exec node dist/index.js\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]