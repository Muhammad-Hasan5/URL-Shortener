import createBreaker from "./index.opossum.js";
import {
  set,
  get,
  incr,
  getKeyTTL,
  updateKeyTTL,
} from "../redis/cache.redis.js";

// creating breakers
export const setBreaker = createBreaker(set);
export const getBreaker = createBreaker(get);
export const incBreaker = createBreaker(incr);
export const getKeyTTLBreaker = createBreaker(getKeyTTL);
export const updateKeyTTLBreaker = createBreaker(updateKeyTTL);
