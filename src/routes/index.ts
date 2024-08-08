import { Router } from "express";

const rootRouter: Router = Router();

rootRouter.use("/auth", authRoutes);

export default rootRouter;
