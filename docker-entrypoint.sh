#!/bin/sh

echo "Starting application..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing command"

# Wait for Meilisearch to be ready
echo "Waiting for Meilisearch..."
until nc -z meilisearch 7700; do
  echo "Meilisearch is unavailable - sleeping"
  sleep 1
done

echo "Meilisearch is up"

# Run database migrations
echo "Running database migrations..."
npx prisma db push --skip-generate

# Run sync-docs script to populate initial data if needed
if [ -f /app/scripts/sync-docs.js ]; then
    echo "Syncing documentation..."
    node /app/scripts/sync-docs.js
fi

# Index documents in Meilisearch
if [ -f /app/scripts/index-documents.js ]; then
    echo "Indexing documents in Meilisearch..."
    # Set the correct Meilisearch host for Docker environment
    export MEILISEARCH_HOST=${MEILISEARCH_HOST:-http://meilisearch:7700}
    node /app/scripts/index-documents.js
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js