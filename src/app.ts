import express from "express";
import router from "./routes/url.route.js";

import { checkPoolReady } from "./db/index.js";
import redis from "./config/redis/index.redis.js";

const app: express.Application = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.use("/", router);

// health check end point
app.get("/health/live", (req, res) => {
  res.status(200).json({
    message: "Server is healthy and live."
  });
});

// server check ready-ness for traffic handling 
app.get("/health/ready", async (req, res) => {
  const dbStatus = await checkPoolReady()

  if(dbStatus == true && redis.status === "ready"){
    res.status(200).json({
      status: "ready",
      database: "up",
      cache: "up",
    })
  } else if(dbStatus == true && redis.status !== "ready"){
    res.status(200).json({
      status: "degraded",
      database: "up",
      cache: "down",
    });
  } else {
    res.status(503).json({
      status: "not_ready",
      database: "down",
      cache: "up/down",
    });
  }
})

export default app;
