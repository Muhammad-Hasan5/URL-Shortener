import pino from "pino";
import env from "../env.js";

const logger = pino({
  level: env.data?.LOG_LEVEL ?? "info"
});

export default logger;
