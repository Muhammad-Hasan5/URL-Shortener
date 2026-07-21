import http from "k6/http";
import { check } from "k6";
import { BASE_URL } from "./helpers.js";


export const options = {
  vus: 1,
  iterations: 5,
};


const TEST_USERS = [
  {
    firstName: "David",
    lastName: "Joe",
    email: "hasanjanu00@gmail.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Ben",
    lastName: "Affleck",
    email: "hasanamir8901@gmail.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Christian",
    lastName: "Bale",
    email: "hasanamir.dev@gmail.com",
    password: "LoadTest123!",
  },
  {
    firstName: "Blake",
    lastName: "Lively",
    email: "sp24bsse0101@maju.edu.pk",
    password: "LoadTest123!",
  },
  {
    firstName: "Brad",
    lastName: "Pitt",
    email: "mawal15492@rapplo.com",
    password: "LoadTest123!",
  },
];


export default function () {
  const user = TEST_USERS[__ITER];

  const res = http.post(`${BASE_URL}/register`, JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "user ready (created or already existed)": (r) =>
      r.status === 201 || r.status === 409 || r.status === 404,
  });
}
