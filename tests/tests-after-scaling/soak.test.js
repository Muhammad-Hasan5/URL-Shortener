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
    { duration: "2m", target: 100 }, // ramp to a sustainable
    { duration: "4h", target: 100 }, // hold 
    { duration: "2m", target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"],
    http_req_failed: ["rate<0.01"],
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
        longURL: `https://example.com/soak-${Date.now()}-${Math.random()}`,
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

  sleep(1 + Math.random() * 2);
}
