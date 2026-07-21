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
    { duration: "1m", target: 200 }, // baseline first
    { duration: "2m", target: 500 }, // past expected peak
    { duration: "2m", target: 1000 }, // well past
    { duration: "3m", target: 1000 }, // hold at breaking point
    { duration: "2m", target: 0 }, // recovery 
  ],
  thresholds: {
    http_req_failed: ["rate<0.20"], 
    http_req_duration: ["p(95)<2000"], 
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
    check(res, {
      "redirect: handled (302, 429, or 503)": (r) =>
        [302, 429, 503].includes(r.status),
    });
  } else if (roll < 0.95) {
    const token = randomToken(data);
    const res = http.post(
      `${BASE_URL}/shorten`,
      JSON.stringify({
        longURL: `https://example.com/stress-${Math.random()}`,
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
