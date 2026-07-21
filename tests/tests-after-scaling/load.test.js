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
  stages: [
    { duration: "30s", target: 50 }, // ramp up to 50 VUs
    { duration: "2m", target: 200 }, // ramp to expected peak
    { duration: "3m", target: 200 }, // hold at peak — this is the real test
    { duration: "30s", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<300", "p(99)<500"],
    http_req_failed: ["rate<0.01"],
    "http_req_duration{name:redirect}": ["p(99)<50"], 
    "http_req_duration{name:shorten}": ["p(99)<300"],
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
        longURL: `https://example.com/page-${Math.floor(Math.random() * 10000)}`,
      }),
      { ...authHeaders(token), tags: { name: "shorten" } },
    );
    check(res, { "shorten: status 201 or existing 200": (r) => [200, 201].includes(r.status) });
  } else {
    const token = randomToken(data);
    const res = http.get(`${BASE_URL}/urls-list`, {
      ...authHeaders(token),
      tags: { name: "list_urls" },
    });
    check(res, { "list urls: status 200": (r) => r.status === 200 });
  }

  sleep(Math.random() * 1.5); 
}
