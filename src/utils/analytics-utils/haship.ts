import { createHash } from "crypto";
import env from "../../config/env.js";
import logger from "../../config/pino-logging/index.pino.js";

export function haship(ip: string, date: Date) {
  const salt = env.IP_HASH_SALT;
  const day = date.toISOString().slice(0, 10);
  logger.info("clientIP:hashed:successfully");
  return createHash("sha256").update(`${ip}:${salt}:${day}`).digest("hex");
}
