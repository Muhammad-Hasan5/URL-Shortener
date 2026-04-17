import express from "express";

const app: express.Application = express();

app.use(express.json({limit: "5mb"}))
app.use(express.urlencoded({limit: "5mb", extended: true}))

app.get("/", (req, res) => {
    res.send("hello world")
})

export default app;
