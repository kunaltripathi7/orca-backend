import { Router } from "express";
import { errorHandler } from "../errorHandler";
import { createChannel } from "../controllers/channelController";
import multer from "multer";

const channelRoutes: Router = Router();
const upload = multer();

channelRoutes.post("/", upload.none(), errorHandler(createChannel));

export default channelRoutes;
