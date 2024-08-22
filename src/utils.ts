import { Request } from "express";
import { db } from "./clients/prismaClient";

export const currentProfile = async (req: Request) => {
  const { userId } = req.auth;
  if (!userId) return null;
  const profile = db.profile.findUnique({
    where: {
      userId,
    },
  });
  return profile;
};
