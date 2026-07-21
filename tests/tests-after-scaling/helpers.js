import http from "k6/http";
import { check } from "k6";

// A rate-limited response is an intentional result from this system, not a transport failure. This keeps `http_req_failed` focused on real failures(5xx, connection errors, wrong routes) while individual checks still state which statuses are acceptable for each scenario.

http.setResponseCallback(http.expectedStatuses(200, 201, 302, 401, 429, 503));


export const BASE_URL = "http://localhost:80";


const TEST_USERS = [
  { email: "hasanjanu00@gmail.com", password: "LoadTest123!" },
  { email: "hasanamir.dev@gmail.com", password: "LoadTest123!" },
  { email: "sp24bsse0101@maju.edu.pk", password: "LoadTest123!" },
  { email: "mawal15492@rapplo.com", password: "LoadTest123!" },
];


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

    return res.cookies.accessToken[0].value;
  });


  const shortCodes = tokens.slice(0, 3).map((token) => {
    const res = http.post(
      `${BASE_URL}/shorten`,
      JSON.stringify({ longURL: "https://example.com/load-test-target" }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    check(res, {
      "setup shorten succeeded": (r) => r.status === 201 || r.status === 200,
      "setup returned short URL": (r) => !!r.json("data.url"),
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Setup failed: could not create a test URL. Status: ${res.status}`);
    }

    const shortUrl = res.json("data.url");
    // k6's Goja runtime does not expose the browser/Node WHATWG `URL` API.
    // The short code is always the final segment of the returned short URL.
    return String(shortUrl).replace(/\/$/, "").split("/").pop();
  });

  return { tokens, shortCodes };
}


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
