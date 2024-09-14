import { NextFunction, Request, Response } from "express";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { ErrorCode } from "../exceptions/root";
import { db } from "../clients/prismaClient";
import { currentProfile } from "../utils";
import { NotFoundException } from "../exceptions/not-found";

export const updateMemberRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  const { memberId } = req.params;
  const serverId = req.query.serverId?.toString() ?? undefined;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId is Missing",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );
  const { role } = req.body;

  if (!role)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "Role not found",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  const server = await db.server.update({
    where: {
      id: serverId,
      profileId: profile.id,
    },
    data: {
      members: {
        update: {
          where: {
            id: memberId,
            profileId: {
              not: profile.id,
            },
          },
          data: { role },
        },
      },
    },
    include: {
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });
  res.json(server);
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  const { memberId } = req.params;
  const serverId = req.query.serverId?.toString() ?? undefined;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId is Missing",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  const server = await db.server.update({
    where: {
      id: serverId,
      profileId: profile.id,
    },
    data: {
      members: {
        deleteMany: {
          id: memberId,
          profileId: {
            not: profile.id,
          },
        },
      },
    },
    include: {
      members: {
        include: {
          profile: true,
        },
        orderBy: {
          role: "asc",
        },
      },
    },
  });

  res.json(server);
};
