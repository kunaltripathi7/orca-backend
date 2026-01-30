import { Router } from "express";
import {
    getOrCreateConversation,
    getConversationById,
} from "../controllers/conversationController";
import {
    getDirectMessages,
    sendDirectMessage,
    editDirectMessage,
    deleteDirectMessage,
} from "../controllers/directMessageController";

const conversationRoutes: Router = Router();

conversationRoutes.get("/", getOrCreateConversation);
conversationRoutes.get("/:conversationId", getConversationById);

conversationRoutes.get("/:conversationId/messages", getDirectMessages);
conversationRoutes.post("/:conversationId/messages", sendDirectMessage);
conversationRoutes.patch("/:conversationId/messages/:messageId", editDirectMessage);
conversationRoutes.delete("/:conversationId/messages/:messageId", deleteDirectMessage);

export default conversationRoutes;
