import { Router } from "express";
import { errorHandler } from "../errorHandler";
import {
  createUserServer,
  deleteServer,
  getCurrentServer,
  getInviteServer,
  getUserServers,
  leaveServer,
  updateInviteCode,
  updateServer,
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

serverRoutes.get("/invite/:inviteCode", errorHandler(getInviteServer));
serverRoutes.get("/by-id/:serverId", errorHandler(getCurrentServer));
serverRoutes.get("/", errorHandler(getUserServers));

serverRoutes.post(
  "/:userId",
  upload.single("imageFile"),
  validateServerRequest,
  errorHandler(createUserServer)
);
serverRoutes.patch("/:serverId/invite-code", errorHandler(updateInviteCode));
serverRoutes.patch("/:serverId/leave", errorHandler(leaveServer));
serverRoutes.patch("/:serverId", errorHandler(updateServer));

serverRoutes.delete("/:serverId", errorHandler(deleteServer));
export default serverRoutes;
