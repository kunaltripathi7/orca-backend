import { NextFunction, Request, Response } from "express";
import { currentProfile } from "../utils";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { db } from "../clients/prismaClient";
import { MemberRole } from "@prisma/client";

export const createChannel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const profile = await currentProfile(req);
  const { name, type } = req.body;
  const serverId = req.query.serverId?.toString() ?? undefined;

  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId is Missing",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  if (!name || !type)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "Name/type is Missing",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  if (name.toLowerCase() === "general" || name.length > 10)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "Name can't be general",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  const server = await db.server.update({
    where: {
      id: serverId,
      members: {
        some: {
          profileId: profile.id,
          role: {
            in: [MemberRole.ADMIN, MemberRole.MODERATOR],
          },
        },
      },
    },
    data: {
      channels: {
        create: {
          profileId: profile.id,
          name,
          type,
        },
      },
    },
  });

  res.json(server);
};
