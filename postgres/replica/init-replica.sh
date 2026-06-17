#!/bin/bash
set -e

echo "Waiting for primary to be ready..."

until pg_isready -h primary -p 5432 -U "$POSTGRES_USER"; do
  sleep 2
done

echo "Primary is ready"

if [ -s "$PGDATA/PG_VERSION" ]; then
  echo "Replica data already exists, skipping pg_basebackup"
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

hot_standby = on              
hot_standby_feedback = on     
                             
EOF

echo "Replica configuration complete"