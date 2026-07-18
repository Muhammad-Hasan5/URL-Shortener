import express from "express";
import urlRouter from "./routes/url.route.js";
import healthCheckRouter from "./routes/healthcheck.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import authrouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

const app = express();

app.use(express.json());
app.use(requestLogger)
app.use(cookieParser())
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.get("/", (req, res) => {
  res.send("welcome to URLY!");
});

//attaching healthcheck-router to app
app.use("/", authrouter)
app.use("/", healthCheckRouter);
//attaching url-router to app
app.use("/", urlRouter);
//attaching analytics router to app
app.use("/", analyticsRouter);

export default app;
