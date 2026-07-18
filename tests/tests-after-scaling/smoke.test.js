import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  authSetup,
  randomToken,
  randomShortCode,
  authHeaders,
} from "./helpers.js";


export const options = {
  vus: 2,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"], 
    http_req_duration: ["p(95)<500"], 
    checks: ["rate>0.99"],
  },
};

export function setup() {
  return authSetup();
}

export default function (data) {
  const token = randomToken(data);

  // 1. Authenticated write path — create a short URL
  const shortenRes = http.post(
    `${BASE_URL}/shorten`,
    JSON.stringify({ originalUrl: "https://example.com/smoke-test" }),
    authHeaders(token),
  );
  check(shortenRes, {
    "shorten: status 201": (r) => r.status === 201,
    "shorten: returns shortCode": (r) => !!r.json("shortCode"),
  });

  // 2. Public read path — redirect, no auth header sent at all
  const code = randomShortCode(data);
  const redirectRes = http.get(`${BASE_URL}/r/${code}`, {
    redirects: 0, 
  });
  check(redirectRes, {
    "redirect: status 302": (r) => r.status === 302,
    "redirect: has Location header": (r) => !!r.headers["Location"],
  });

  // 3. Authenticated read path — user's own URL list
  const listRes = http.get(`${BASE_URL}/urls-list`, authHeaders(token));
  check(listRes, {
    "list urls: status 200": (r) => r.status === 200,
  });

  // 4. Negative case — confirm auth is actually being enforced
  const noAuthRes = http.post(
    `${BASE_URL}/api/v1/shorten`,
    JSON.stringify({ originalUrl: "https://example.com/should-fail" }),
    { headers: { "Content-Type": "application/json" } }, 
  );
  check(noAuthRes, {
    "shorten without token: rejected with 401": (r) => r.status === 401,
  });

  sleep(1);
}
