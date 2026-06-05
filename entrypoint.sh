#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -d "$PG_PRIMARY_STRING"; do
  echo "PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done

echo "PostgreSQL ready. Running migrations..."
npm run migrate:latest

echo "Starting server..."
exec node dist/index.js