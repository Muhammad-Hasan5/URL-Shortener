import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  authSetup,
  randomToken,
  randomShortCode,
  authHeaders,
} from "./helpers.js";

// Stress test — deliberately overloads the system to find where it
// breaks and how it behaves once it does. Same traffic mix as the load
// test, but ramps well past your expected peak (200 VUs) up to 1000+.
//
// What you're looking for isn't "does it stay fast" — it's:
//   - Does it degrade gracefully (slower responses, but still 2xx)?
//   - Or does it fail catastrophically (500s, connection resets, crashes)?
//   - Does your rate limiter kick in and start returning 429s as designed?
//   - Does it recover once load drops back down in the final stage?
export const options = {
  stages: [
    { duration: "1m", target: 200 }, // known-good baseline first
    { duration: "2m", target: 500 }, // past expected peak
    { duration: "2m", target: 1000 }, // well past — find the ceiling
    { duration: "3m", target: 1000 }, // hold at breaking point
    { duration: "2m", target: 0 }, // recovery — does it come back?
  ],
  thresholds: {
    // Loose thresholds — we EXPECT degradation, we're measuring how much
    http_req_failed: ["rate<0.20"], // some failures expected under stress
    http_req_duration: ["p(95)<2000"], // must not completely fall over
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
    // Don't hard-fail the check under stress — just record what happens.
    // A 429 (rate limited) or 503 (shedding load) is a valid, expected
    // outcome here — it means your reliability layer from Phase 1 is
    // doing its job instead of the DB falling over.
    check(res, {
      "redirect: handled (302, 429, or 503)": (r) =>
        [302, 429, 503].includes(r.status),
    });
  } else if (roll < 0.95) {
    const token = randomToken(data);
    const res = http.post(
      `${BASE_URL}/shorten`,
      JSON.stringify({
        originalUrl: `https://example.com/stress-${Math.random()}`,
      }),
      { ...authHeaders(token), tags: { name: "shorten" } },
    );
    check(res, {
      "shorten: handled (201, 429, or 503)": (r) =>
        [201, 429, 503].includes(r.status),
    });
  } else {
    const token = randomToken(data);
    const res = http.get(`${BASE_URL}/urls-list`, {
      ...authHeaders(token),
      tags: { name: "list_urls" },
    });
    check(res, {
      "list urls: handled (200, 429, or 503)": (r) =>
        [200, 429, 503].includes(r.status),
    });
  }
}
