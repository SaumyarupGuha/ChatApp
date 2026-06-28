import express from "express";
import { suggestMessage } from "../controllers/aiController.js";
import { protectRoute } from "../middleware/auth.js";

const aiRouter = express.Router();

aiRouter.post("/suggest", protectRoute, suggestMessage);

export default aiRouter;
