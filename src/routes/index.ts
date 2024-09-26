import { Router } from "express";
import authRoutes from "./auth";
import serverRoutes from "./server";
import { ClerkExpressRequireAuth, StrictAuthProp } from "@clerk/clerk-sdk-node";
import { v2 as cloudinary } from "cloudinary";
import { CLOUD_API_KEY, CLOUD_API_SECRET, CLOUD_NAME } from "../secrets";
import memberRoutes from "./member";
import channelRoutes from "./channel";

declare global {
  namespace Express {
    interface Request extends StrictAuthProp {}
  }
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

const rootRouter: Router = Router();

rootRouter.use(ClerkExpressRequireAuth());
rootRouter.use("/user", authRoutes);
rootRouter.use("/servers", serverRoutes);
rootRouter.use("/member", memberRoutes);
rootRouter.use("/channels", channelRoutes);

export default rootRouter;
