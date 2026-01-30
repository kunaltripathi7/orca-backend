import { Router } from "express";
import {
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
} from "../controllers/messageController";

const messageRoutes: Router = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", sendMessage);
messageRoutes.patch("/:messageId", editMessage);
messageRoutes.delete("/:messageId", deleteMessage);

export default messageRoutes;
