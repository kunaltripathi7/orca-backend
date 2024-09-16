import { Router } from "express";
import { errorHandler } from "../errorHandler";
import { createChannel, deleteChannel } from "../controllers/channelController";
import multer from "multer";

const channelRoutes: Router = Router();
const upload = multer();

channelRoutes.post("/", upload.none(), errorHandler(createChannel));
channelRoutes.delete("/:channelId", errorHandler(deleteChannel));

export default channelRoutes;
