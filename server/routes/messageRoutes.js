import express from "express";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, acceptRequest, blockUser, unblockUser, scheduleMessage, getScheduledMessages } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/scheduled", protectRoute, getScheduledMessages);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.post("/schedule/:id", protectRoute, scheduleMessage);
messageRouter.put("/accept/:id", protectRoute, acceptRequest);
messageRouter.put("/block/:id", protectRoute, blockUser);
messageRouter.put("/unblock/:id", protectRoute, unblockUser);

export default messageRouter;
