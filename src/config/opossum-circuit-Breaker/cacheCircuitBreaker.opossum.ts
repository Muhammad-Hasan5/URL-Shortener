import createBreaker from "./index.opossum.js";
import { set, get } from "../redis/cache.redis.js";

// creating breakers
export const setBreaker = createBreaker(set);
export const getBreaker = createBreaker(get);
