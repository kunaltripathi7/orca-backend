import { NextFunction, Request, Response } from "express";
import { db } from "../clients/prismaClient";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import cloudinary from "cloudinary";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { v4 as uuidv4 } from "uuid";
import { MemberRole } from "@prisma/client";

export const getUserServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  const server = await db.server.findFirst({
    where: {
      members: {
        some: {
          profileId: userId,
        },
      },
    },
  });

  if (server) {
    return res.json(server);
  } else {
    next(
      new NotFoundException(
        "Server Not Found, Create One",
        ErrorCode.NO_SERVER_FOUND
      )
    );
  }
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
