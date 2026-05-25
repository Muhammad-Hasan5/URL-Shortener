import CircuitBreaker from "opossum";
import logger from "../pino-logging/index.pino.js";

const breaker = new CircuitBreaker(async (fn: () => Promise<unknown>) => fn(), {
  timeout: 300,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5,
});

breaker.on("open", () =>
  logger.error("redis.circuit.open — falling back to DB"),
);
breaker.on("halfOpen", () =>
  logger.info("redis.circuit.halfOpen — testing Redis"),
);
breaker.on("close", () =>
  logger.info("redis.circuit.closed — Redis recovered"),
);

export default breaker;
