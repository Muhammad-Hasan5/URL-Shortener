import { Router } from "express";
import { shortURL, redirect } from "../controllers/url.controller.js";
const router = Router();
router.route("/shorten").post(shortURL);
router.route("/:shortCode").get(redirect);
export default router;
//# sourceMappingURL=url.route.js.map