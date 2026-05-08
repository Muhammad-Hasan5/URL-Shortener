import { Router } from "express";
import { shortURL, redirect } from "../controllers/url.controller.js";
import limiter from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.route("/shorten").post(limiter, shortURL);
router.route("/:shortCode").get(redirect);

export default router;
