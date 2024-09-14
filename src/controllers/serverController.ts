import { NextFunction, Request, Response } from "express";
import { db } from "../clients/prismaClient";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import cloudinary from "cloudinary";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { v4 as uuidv4 } from "uuid";
import { MemberRole } from "@prisma/client";
import { currentProfile } from "../utils";
import { InternalException } from "../exceptions/internal-exception";

export const getUserServers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );
  const servers = await db.server.findMany({
    where: {
      members: {
        some: {
          profileId: profile?.id,
        },
      },
    },
  });

  res.json(servers);
};

export const createUserServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  const { name } = req.body;
  if (!req.file)
    next(
      new UnprocessbleEntity(
        new Error(),
        "User not Found",
        ErrorCode.UNPROCESSABLE_ENTITY
      )
    );

  const imageUrl = await uploadImage(req.file as Express.Multer.File);
  const newServer = await db.server.create({
    data: {
      profileId: userId,
      imageUrl,
      name,
      inviteCode: uuidv4(),
      channels: {
        create: [{ name: "general", profileId: userId }],
      },
      members: {
        create: [{ profileId: userId, role: MemberRole.ADMIN }],
      },
    },
  });
  res.json(newServer);
};

const uploadImage = async (file: Express.Multer.File) => {
  const image = file;
  //cloudinary method to upload as base64 string
  const base64Image = Buffer.from(image.buffer).toString("base64");
  const dataURI = `data:${image.mimetype};base64,${base64Image}`;
  const uploadResponse = await cloudinary.v2.uploader.upload(dataURI);
  return uploadResponse.url;
};

export const updateServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serverId } = req.params;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId not found",
        ErrorCode.SERVERID_NOT_FOUND
      )
    );

  const profile = await currentProfile(req);

  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  const formData = req.body;
  console.log(formData);

  const server = undefined;

  // const server = await db.server.update({
  //   where: {
  //     id: serverId,
  //     profileId: profile?.id,
  //   },
  //   data: {
  //     udpated,
  //   },
  // });

  if (!server) {
    return next(
      new InternalException(
        "Operation can be only performed by the admin of the server",
        new Error(),
        ErrorCode.ADMIN_NOT_FOUND
      )
    );
  }
  res.json(server);
};

export const getCurrentServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serverId } = req.params;
  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId not found",
        ErrorCode.SERVERID_NOT_FOUND
      )
    );
  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );
  const server = await db.server.findUnique({
    where: {
      id: serverId,
    },
    include: {
      channels: {
        orderBy: {
          createdAt: "asc",
        },
      },
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

  if (!server) {
    return next(
      new NotFoundException(
        "Server Not Found, Create One",
        ErrorCode.NO_SERVER_FOUND
      )
    );
  }
  res.json(server);
};

export const updateInviteCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serverId } = req.params;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId not found",
        ErrorCode.SERVERID_NOT_FOUND
      )
    );

  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );
  const server = await db.server.update({
    where: {
      id: serverId,
      profileId: profile?.id,
    },
    data: {
      inviteCode: uuidv4(),
    },
  });

  if (!server) {
    return next(
      new InternalException(
        "Operation can be only performed by the admin of the server",
        new Error(),
        ErrorCode.ADMIN_NOT_FOUND
      )
    );
  }
  res.json(server);
};

export const getInviteServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inviteCode } = req.params;

  if (!inviteCode)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "Invite code not found",
        ErrorCode.INVITE_CODE_NOT_FOUND
      )
    );

  const profile = await currentProfile(req);
  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  // if user already exists in that server
  const existingServer = await db.server.findFirst({
    where: {
      inviteCode: inviteCode,
      members: {
        some: { profileId: profile.id },
      },
    },
  });

  if (existingServer)
    return next(
      new InternalException(
        "User Already exists",
        new Error(),
        ErrorCode.USER_ALREADY_EXISTS
      )
    );

  const server = await db.server.update({
    where: {
      inviteCode: inviteCode,
    },
    data: {
      members: {
        create: [
          {
            profileId: profile.id,
          },
        ],
      },
    },
  });

  if (!server)
    return next(
      new InternalException(
        "Can't Join the server",
        new Error(),
        ErrorCode.NO_SERVER_FOUND
      )
    );
  res.json(server);
};

export const leaveServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serverId } = req.params;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId not found",
        ErrorCode.SERVERID_NOT_FOUND
      )
    );

  const profile = await currentProfile(req);

  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  const server = await db.server.update({
    where: {
      id: serverId,
      profileId: {
        not: profile.id,
      },
      members: {
        some: {
          profileId: profile.id,
        },
      },
    },
    data: {
      members: {
        deleteMany: {
          profileId: profile.id,
        },
      },
    },
  });

  res.json(server);
};

export const deleteServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { serverId } = req.params;

  if (!serverId)
    return next(
      new UnprocessbleEntity(
        new Error(),
        "ServerId not found",
        ErrorCode.SERVERID_NOT_FOUND
      )
    );

  const profile = await currentProfile(req);

  if (!profile)
    return next(
      new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
    );

  const server = await db.server.delete({
    where: {
      id: serverId,
      profileId: profile.id,
    },
  });

  res.json(server);
};
