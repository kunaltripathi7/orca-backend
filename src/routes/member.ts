import { Router } from "express";
import { errorHandler } from "../errorHandler";
import {
  removeMember,
  updateMemberRole,
} from "../controllers/memberController";

const memberRoutes: Router = Router();

memberRoutes.delete("/:memberId", errorHandler(removeMember));
memberRoutes.patch("/:memberId", errorHandler(updateMemberRole));

export default memberRoutes;
