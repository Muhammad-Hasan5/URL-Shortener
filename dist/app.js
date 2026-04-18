import express from "express";
import router from "./routes/url.route.js";
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use("/", router);
app.get("/", (req, res) => {
    res.send("hello world");
});
export default app;
//# sourceMappingURL=app.js.map