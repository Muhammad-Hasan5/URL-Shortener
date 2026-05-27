import { cacheRequests } from "../../config/prometheus-metrics/index.prometheus.js";
import logger from "../../config/pino-logging/index.pino.js";
import type { CacheRecord } from "../../@types/cache/index.types.js";

interface ILogObject {
  reqId: any;
  reqMethod: string;
  cacheMethod: string;
  cacheResult?: CacheRecord | null;
  route: string;
}

export function cacheHitLog(logObject: ILogObject): void {
  /* cache hit-miss counter */
  cacheRequests.inc({ result: "hit", cache_method: logObject.cacheMethod });

  //logging cache-hit
  logger.info(
    {
      id: logObject.reqId,
      request_method: logObject.reqMethod,
      cache_method: logObject.cacheMethod,
      cache_result: logObject.cacheResult,
      route: logObject.route,
    },
    `${logObject.route}.cache_hit`,
  );
}

export function cacheMissLog(logObject: ILogObject): void {
  /* cache hit-miss counter */
  cacheRequests.inc({ result: "miss", cache_method: logObject.cacheMethod });

  //logging cache-miss
  logger.info(
    {
      id: logObject.reqId,
      request_method: logObject.reqMethod,
      cache_method: logObject.cacheMethod,
      route: logObject.route,
    },
    `${logObject.route}.cache_missed`,
  );
}
