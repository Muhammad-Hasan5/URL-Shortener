//build
FROM node:20.19.4-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

//production
FROM node:20.19.4-alpine as production
RUN apk add --no-cache postgrsql-client
WORKDIR /app
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/src/knexfile.ts ./src/knexfile.ts
COPY --from=builder /app/tsconfig*.json ./

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]