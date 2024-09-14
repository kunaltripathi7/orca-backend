import { NextFunction, Request } from "express";
import { db } from "./clients/prismaClient";
import { NotFoundException } from "./exceptions/not-found";
import { ErrorCode } from "./exceptions/root";

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
