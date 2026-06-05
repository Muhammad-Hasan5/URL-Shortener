#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<-SQL
    DO
    \$do\$
    BEGIN
        IF NOT EXISTS (
            SELECT FROM pg_catalog.pg_roles
            WHERE rolname = 'replicator'
        ) THEN
            CREATE ROLE replicator 
            WITH REPLICATION LOGIN PASSWORD '${REPLICA_PASS}';
        END IF;
    END
    \$do\$;
SQL

grep -qxF 'wal_level = replica' "$PGDATA/postgresql.conf" || cat >> "$PGDATA/postgresql.conf" <<-EOF

wal_level = replica
max_wal_senders = 3
wal_keep_size = 256MB
hot_standby = on
EOF

grep -qF 'replication replicator' "$PGDATA/pg_hba.conf" || \
  echo "host replication replicator 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"


echo "Primary replication complete"