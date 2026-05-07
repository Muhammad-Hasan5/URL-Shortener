import createBreaker from "./index.js";
import { set, get } from "../redis/cache.redis.js";

// creating breakers
export const setBreaker = createBreaker(set);
export const getBreaker = createBreaker(get);
