import { Router } from "express";
import { getCurrentUser } from "../controllers/authController";
import { errorHandler } from "../errorHandler";
import { validateUserRequest } from "../middlewares/validate";

const authRoutes: Router = Router();
authRoutes.post("/", validateUserRequest, errorHandler(getCurrentUser));

export default authRoutes;
