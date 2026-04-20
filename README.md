# Distributed URL Shortener (Node.js + PostgreSQL + Redis)

## Overview

This project is a URL shortener built with a layered architecture using:

* **Node.js + Express** for API handling
* **PostgreSQL** for persistent storage
* **Redis** for caching (performance optimization)

---

## Architecture

### Core Flow

#### URL Creation (POST `/shorten`)

1. Generate unique ID (Snowflake-style)
2. Convert ID → Base62 short code
3. Store in PostgreSQL
4. Return short URL

#### Redirect (GET `/:shortCode`)

1. Check Redis cache
2. If hit → redirect immediately
3. If miss → query PostgreSQL
4. Store result in Redis
5. Redirect user

---

## Tech Decisions

### ID Generation

* Snowflake-style ID using `BigInt`
* Avoided JavaScript number overflow issues
* Guarantees uniqueness without DB dependency

### Encoding

* Base62 encoding for compact URLs

### Database

* PostgreSQL with:

  * `BIGINT` primary key
  * `UNIQUE` constraint on `short_code`
  * Index on `short_code` for fast lookups

### Caching Strategy

* Cache-aside (lazy loading)
* Key format: `url:<shortCode>`
* TTL: 24 hours

---

## Performance Testing

Load testing was done using **autocannon**.

---

# Baseline Performance (No Redis)

### Redirect Test (GET)

* **Connections:** 100
* **Duration:** 20s

| Metric       | Value  |
| ------------ | ------ |
| Requests/sec | ~3440  |
| Avg Latency  | ~28 ms |
| p99 Latency  | ~50 ms |

### Observation

* System scaled up to ~3.4k req/sec
* Increasing connections did **not increase throughput significantly**
* Latency increased under load

### Conclusion

> System became **database-bound**

---

# First Redis Attempt (Cloud / Upstash)

### Result

| Metric       | Value     |
| ------------ | --------- |
| Requests/sec | ~320 ❌    |
| Avg Latency  | ~300 ms ❌ |

### Problem

* Redis hosted remotely (cloud)
* Each request required a **network round trip**

### Insight

> Adding a remote cache introduced **network latency**, making performance worse than direct DB access.

### Fix

* Switched Redis from cloud to **local Docker instance**

---

# Second Redis Attempt (Local Redis)

### Redirect Test (GET)

* **Connections:** 100
* **Duration:** 20s

| Metric       | Value  |
| ------------ | ------ |
| Requests/sec | ~1600  |
| Avg Latency  | ~62 ms |

### Observation

* Performance still worse than baseline
* Throughput dropped ~50%

---

# Root Cause Analysis

### Issue 1: Blocking Cache Usage

```ts
await redis.get(...)
await db.query(...)
await redis.set(...)
```

* All operations were **sequential**
* Redis added extra latency instead of removing DB pressure

---

### Issue 2: Testing with a Single Key

* Same short code used repeatedly
* PostgreSQL likely already caching internally
* Redis provided **no real benefit**

---

### Issue 3: DB Was Already Fast

* Indexed lookup ≈ 2–5 ms
* Redis overhead ≈ similar or higher under load

---

# Fixes Applied

### 1. Non-blocking Cache Write

```ts
setToCache(shortCode, longURL); // no await
```

---

### 2. Proper Cache Flow

```ts
const cached = await redis.get(key);
if (cached) return redirect;

const dbResult = await db.query(...);
setToCache(...);
return redirect;
```

---

### 3. Switched Redis to Local

* Removed network latency
* Enabled realistic benchmarking

---

### 4. Connection Pool Awareness

* PostgreSQL pool tuning considered
* Identified DB connection saturation under load

---

# Current System Status

### Strengths

* Clean layered architecture
* Unique ID generation without DB dependency
* Indexed DB queries
* Cache layer implemented correctly
* System tested under load

---

### Limitations

* Redis not beneficial under current dataset size
* Write path still DB-bound
* No horizontal scaling yet

---

# Future Improvements

* Add **multi-key load testing**
* Introduce **Redis clustering**
* Implement **rate limiting**
* Add **analytics (click tracking)**
* Use **message queues for write optimization**
* Deploy system to cloud for realistic distributed testing

---

# Final Thoughts

This project evolved from a simple URL shortener into a **performance and systems design exercise**.

> Building the system is only the first step — understanding its behavior under load is where real learning happens.

---
