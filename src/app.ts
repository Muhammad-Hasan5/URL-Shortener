import cors from "cors";
import express from "express";
import urlRouter from "./routes/url.route.js";
import healthCheckRouter from "./routes/healthcheck.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import authrouter from "./routes/auth.route.js";
import swaggerRouter from "./docs/swagger.js";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import env from "./config/env.js";

const app = express();

const allowedOrigins = [env.LOCAL_FRONTEND_URL, env.PRODUCTION_FRONTEND_URL];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposedHeaders: ["Location", "X-Request-Id"],
  }),
);

app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.get("/", (req, res) => {
  res.send("welcome to URLY!");
});

//attaching swagger docs to app
app.use("/api-docs", swaggerRouter);
//attaching healthcheck-router to app
app.use("/", authrouter);
app.use("/", healthCheckRouter);
//attaching url-router to app
app.use("/", urlRouter);
//attaching analytics router to app
app.use("/", analyticsRouter);

export default app;
