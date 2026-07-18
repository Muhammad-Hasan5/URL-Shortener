import http from "k6/http";
import { check } from "k6";


export const BASE_URL = "http://localhost:80";

// A pool of pre-existing test users. Don't register a fresh user per VU —
// at 200+ concurrent VUs that hammers your bcrypt hashing and DB writes
// and you end up load-testing your registration flow by accident, not
// the redirect/shorten paths you actually care about.
//
// Seed these users into your DB once before running tests (see the
// seed-users.js script below), then every test just logs in.
const TEST_USERS = [
  { email: "loadtest1@test.com", password: "LoadTest123!" },
  { email: "loadtest2@test.com", password: "LoadTest123!" },
  { email: "loadtest3@test.com", password: "LoadTest123!" },
  { email: "loadtest4@test.com", password: "LoadTest123!" },
  { email: "loadtest5@test.com", password: "LoadTest123!" },
];

// Runs ONCE before the test starts (not per-VU, not per-iteration).
// Logs in every seeded test user and returns their tokens plus a set of
// short codes to hit during the redirect test. This return value is
// passed into default() as its argument on every VU.
export function authSetup() {
  const tokens = TEST_USERS.map((user) => {
    const res = http.post(
      `${BASE_URL}/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { "Content-Type": "application/json" } },
    );

    check(res, {
      "login succeeded": (r) => r.status === 200,
    });

    if (res.status !== 200) {
      throw new Error(
        `Setup failed: could not log in ${user.email}. Did you run seed-users.js first? Status: ${res.status}`,
      );
    }

    return res.json("accessToken");
  });

  // Pre-create a handful of short URLs so the redirect test has known,
  // valid codes to hit instead of guessing or creating-then-redirecting
  // in the same iteration (which would conflate write and read latency).
  const shortCodes = tokens.slice(0, 3).map((token) => {
    const res = http.post(
      `${BASE_URL}/api/v1/shorten`,
      JSON.stringify({ originalUrl: "https://example.com/load-test-target" }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.json("shortCode");
  });

  return { tokens, shortCodes };
}

// Picks a random token so load spreads across multiple "users" rather
// than every VU hammering the API as the exact same account.
export function randomToken(data) {
  return data.tokens[Math.floor(Math.random() * data.tokens.length)];
}

export function randomShortCode(data) {
  return data.shortCodes[Math.floor(Math.random() * data.shortCodes.length)];
}

export function authHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
}
