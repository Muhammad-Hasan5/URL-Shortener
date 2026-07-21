import express from "express";
import urlRouter from "./routes/url.route.js";
import healthCheckRouter from "./routes/healthcheck.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import authrouter from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  express.json({
    type: (req) => {
      const contentType = req.headers["content-type"];
      const value = Array.isArray(contentType) ? contentType[0] : contentType;
      return !value || /application\/(?:[\w.-]+\+)?json/i.test(value);
    },
  }),
);

app.use(requestLogger)
app.use(cookieParser())
app.use(express.urlencoded({ limit: "5mb", extended: true }));

app.get("/", (req, res) => {
  res.send("welcome to URLY!");
});


app.use("/", authrouter)

app.use("/", healthCheckRouter);

app.use("/", urlRouter);

app.use("/", analyticsRouter);

export default app;
