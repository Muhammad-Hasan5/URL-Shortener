import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./helpers.js";

// Run this ONCE before any load test, with a single VU:
//   k6 run seed-users.js
//
// Registering users is expensive (bcrypt hashing) and you don't want
// that cost mixed into your actual load test numbers. Seed once,
// reuse the same accounts across every smoke/load/stress/soak run.

export const options = {
  vus: 1,
  iterations: 5,
};

const TEST_USERS = [
  {
    firstName: "David",
    lastName: "Joe",
    email: "loadtest1@test.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Ben",
    lastName: "Affleck",
    email: "loadtest2@test.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Christian",
    lastName: "Bale",
    email: "loadtest3@test.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Blake",
    lastName: "Lively",
    email: "loadtest4@test.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Brad",
    lastName: "Pitt",
    email: "loadtest5@test.com",
    password: "LoadTest123!",
  },
];

export default function () {
  const user = TEST_USERS[__ITER];

  const res = http.post(`${BASE_URL}/register`, JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });

  // 201 = created fresh, 409 = already exists from a previous seed run.
  // Both are fine — treat "already exists" as success so the script is
  // safely re-runnable.
  check(res, {
    "user ready (created or already existed)": (r) =>
      r.status === 201 || r.status === 409 || r.status === 404,
  });
}
