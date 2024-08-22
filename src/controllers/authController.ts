import { NextFunction, Request, Response } from "express";
import { db } from "../clients/prismaClient";
import { ErrorCode } from "../exceptions/root";
import { User } from "../types/types";
import { UnprocessbleEntity } from "../exceptions/bad-requests";

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user: User = req.body;
  if (!user)
    next(
      new UnprocessbleEntity(
        new Error(),
        "User not Found",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  let userProfile = await db.profile.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (userProfile) return res.json(userProfile);

  const newProfile = await db.profile.create({
    data: {
      userId: user.id,
      name: user.name,
      imageUrl: user.imageUrl,
      email: user.email,
    },
  });

  res.json(newProfile);
};
