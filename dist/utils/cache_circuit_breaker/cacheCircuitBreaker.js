import createBreaker from "./index.js";
import { set, get } from "../../config/redis/cache.redis.js";
// creating breakers
export const setBreaker = createBreaker(set);
export const getBreaker = createBreaker(get);
//# sourceMappingURL=cacheCircuitBreaker.js.map