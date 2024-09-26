import { Router } from "express";
import { errorHandler } from "../errorHandler";
import {
  createChannel,
  deleteChannel,
  editChannel,
} from "../controllers/channelController";
import multer from "multer";

const channelRoutes: Router = Router();
const upload = multer();
channelRoutes.get("/:channelId", errorHandler(getChannel));
channelRoutes.post("/", upload.none(), errorHandler(createChannel));
channelRoutes.delete("/:channelId", errorHandler(deleteChannel));
channelRoutes.patch("/:channelId", upload.none(), errorHandler(editChannel));

export default channelRoutes;
