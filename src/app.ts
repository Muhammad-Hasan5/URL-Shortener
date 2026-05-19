import express from "express";
import urlRouter from "./routes/url.route.js";
import healthCheckRouter from "./routes/healthcheck.route.js";
import { logRequestID } from "./middlewares/logRequestID.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";

const app: express.Application = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

//middleware to attach requestid for each
// log to Global Request of express
app.use(logRequestID);
app.use(requestLogger);

//attaching url-router to app
app.use("/", urlRouter);
//attaching healthcheck-router to app
app.use("/", healthCheckRouter);

export default app;
