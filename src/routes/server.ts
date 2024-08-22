import { Router } from "express";
import { errorHandler } from "../errorHandler";
import {
  createUserServer,
  getUserServer,
} from "../controllers/serverController";
import multer from "multer";
import { validateServerRequest } from "../middlewares/validate";

const serverRoutes: Router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

serverRoutes.get("/:userId", errorHandler(getUserServer));
serverRoutes.post(
  "/:userId",
  upload.single("imageFile"),
  validateServerRequest,
  errorHandler(createUserServer)
);

export default serverRoutes;
