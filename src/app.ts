import express from "express";
import router from "./routes/url.route.js";
import { logRequestID } from "./middlewares/logRequestID.middleware.js";

import { checkPoolReady } from "./db/pool.db.js";
import redis from "./config/redis/index.redis.js";

import register from "./config/prometheus-metrics/index.prometheus.js";

import logger from "./config/pino-logging/index.pino.js";

const app: express.Application = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

//middleware to attach requestid for each
// log to Global Request of express
app.use(logRequestID);

// rate limiter middleware for POST endpoints
app.use("/", router);

// health check end point
app.get("/health/live", (req, res) => {
  res.status(200).json({
    message: "Server is healthy and live.",
  });
});

// server check ready-ness for traffic handling
app.get("/health/ready", async (req, res) => {
  const dbStatus = await checkPoolReady();

  if (dbStatus == true && redis.status === "ready") {
    logger.info({
      status: "ready",
      database: "up",
      cache: "up",
    });

    res.status(200).json({
      status: "ready",
      database: "up",
      cache: "up",
    });
  } else if (dbStatus == true && redis.status !== "ready") {
    logger.info({
      status: "degraded",
      database: "up",
      cache: "down",
    });

    res.status(200).json({
      status: "degraded",
      database: "up",
      cache: "down",
    });
  } else {
    logger.info({
      status: "not_ready",
      database: "down",
      cache: "up/down",
    });

    res.status(503).json({
      status: "not_ready",
      database: "down",
      cache: "up/down",
    });
  }
});

// metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
});

export default app;
