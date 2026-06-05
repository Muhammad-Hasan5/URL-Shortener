#!/bin/bash
set -e

echo "Waiting for primary to be ready..."

until pg_isready -h primary -p 5432 -U "$POSTGRES_USER"; do
  sleep 2
done

echo "Primary is ready"

if [ -s "$PGDATA/PG_VERSION" ]; then
  echo "✓ Replica data already exists, skipping pg_basebackup"
  exit 0
fi

echo "Cloning primary with pg_basebackup..."

PGPASSWORD="$REPLICA_PASS" pg_basebackup \
  --host=primary \
  --port=5432 \
  --username=replicator \
  --pgdata="$PGDATA" \
  --format=plain \     
  --write-recovery-conf \ 
  --checkpoint=fast \  
  --progress \
  --verbose

echo "✓ Base backup complete"

cat >> "$PGDATA/postgresql.conf" <<-EOF

# Replica settings
hot_standby = on              # allow read queries while in recovery
hot_standby_feedback = on     # tell primary about our long-running queries
                              # prevents primary from vacuuming rows we're reading
EOF

echo "Replica configuration complete"