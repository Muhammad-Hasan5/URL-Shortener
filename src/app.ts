import express from "express";
import urlRouter from "./routes/url.route.js";
import healthCheckRouter from "./routes/healthcheck.route.js";


const app: express.Application = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

//attaching healthcheck-router to app
app.use("/api", healthCheckRouter);
//attaching url-router to app
app.use("/", urlRouter);


export default app;
