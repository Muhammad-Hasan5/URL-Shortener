import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  authSetup,
  randomToken,
  randomShortCode,
  authHeaders,
} from "./helpers.js";

// Soak test — moderate load (not peak, not stress) held for a long
// duration. The point isn't to find a breaking point, it's to catch
// problems that only appear over time:
//   - Memory leaks (watch RSS climb steadily in your Grafana dashboard)
//   - Connection pool exhaustion (pg pool never releasing connections)
//   - Redis TTL/eviction issues (keys never expiring, memory growing)
//   - Slow degradation in p99 latency across the run, not just at the end
//   - Log file growth filling disk if logs aren't rotated
//
// Run this against a Grafana dashboard open in another window — the
// interesting result isn't the k6 summary, it's watching your memory
// and connection-pool graphs over the full duration.
export const options = {
  stages: [
    { duration: "2m", target: 100 }, // ramp to a sustainable, moderate load
    { duration: "4h", target: 100 }, // hold — this is the actual soak
    { duration: "2m", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
    // If p99 in the last 10 minutes is much worse than the first 10
    // minutes, that's your signal something is leaking or degrading —
    // compare these manually in Grafana rather than as a single threshold.
  },
};

export function setup() {
  return authSetup();
}

export default function (data) {
  const roll = Math.random();

  if (roll < 0.8) {
    const code = randomShortCode(data);
    const res = http.get(`${BASE_URL}/r/${code}`, {
      redirects: 0,
      tags: { name: "redirect" },
    });
    check(res, { "redirect: status 302": (r) => r.status === 302 });
  } else if (roll < 0.95) {
    const token = randomToken(data);
    const res = http.post(
      `${BASE_URL}/shorten`,
      JSON.stringify({
        originalUrl: `https://example.com/soak-${Date.now()}-${Math.random()}`,
      }),
      { ...authHeaders(token), tags: { name: "shorten" } },
    );
    check(res, { "shorten: status 201": (r) => r.status === 201 });
  } else {
    const token = randomToken(data);
    const res = http.get(`${BASE_URL}/urls-list`, {
      ...authHeaders(token),
      tags: { name: "list_urls" },
    });
    check(res, { "list urls: status 200": (r) => r.status === 200 });
  }

  // Realistic think-time — real users pause between actions.
  // This also keeps total request volume moderate over 4 hours instead
  // of hammering nonstop, which better resembles sustained real traffic.
  sleep(1 + Math.random() * 2);
}
