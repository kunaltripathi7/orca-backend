import { NextFunction, Request, Response } from "express";
import { currentProfile } from "../utils";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { db } from "../clients/prismaClient";
import { emitToChannel } from "../socket";

const MESSAGES_BATCH = 10;

export const getMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const channelId = req.query.channelId?.toString();
    const cursor = req.query.cursor?.toString();

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!channelId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Channel ID is required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    let messages;

    if (cursor) {
        messages = await db.message.findMany({
            take: MESSAGES_BATCH,
            skip: 1,
            cursor: { id: cursor },
            where: { channelId },
            include: {
                member: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } else {
        messages = await db.message.findMany({
            take: MESSAGES_BATCH,
            where: { channelId },
            include: {
                member: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    let nextCursor = null;
    if (messages.length === MESSAGES_BATCH) {
        nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    res.json({ items: messages, nextCursor });
};

export const sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const channelId = req.query.channelId?.toString();
    const serverId = req.query.serverId?.toString();
    const { content, fileUrl } = req.body;

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!channelId || !serverId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Channel ID and Server ID are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    if (!content && !fileUrl)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Content or file is required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const server = await db.server.findFirst({
        where: {
            id: serverId,
            members: {
                some: { profileId: profile.id },
            },
        },
        include: {
            members: true,
        },
    });

    if (!server)
        return next(
            new NotFoundException("Server not found", ErrorCode.NO_SERVER_FOUND)
        );

    const channel = await db.channel.findFirst({
        where: {
            id: channelId,
            serverId,
        },
    });

    if (!channel)
        return next(
            new NotFoundException("Channel not found", ErrorCode.NO_SERVER_FOUND)
        );

    const member = server.members.find((m) => m.profileId === profile.id);

    if (!member)
        return next(
            new NotFoundException("Member not found", ErrorCode.USER_NOT_FOUND)
        );

    const message = await db.message.create({
        data: {
            content: content || "",
            fileUrl,
            channelId,
            memberId: member.id,
        },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    emitToChannel(channelId, "message:new", message);

    res.json(message);
};

export const editMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const { messageId } = req.params;
    const channelId = req.query.channelId?.toString();
    const serverId = req.query.serverId?.toString();
    const { content } = req.body;

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!messageId || !channelId || !serverId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Message ID, Channel ID, and Server ID are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const server = await db.server.findFirst({
        where: {
            id: serverId,
            members: {
                some: { profileId: profile.id },
            },
        },
        include: { members: true },
    });

    if (!server)
        return next(
            new NotFoundException("Server not found", ErrorCode.NO_SERVER_FOUND)
        );

    const member = server.members.find((m) => m.profileId === profile.id);

    if (!member)
        return next(
            new NotFoundException("Member not found", ErrorCode.USER_NOT_FOUND)
        );

    const message = await db.message.findFirst({
        where: {
            id: messageId,
            channelId,
        },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    if (!message || message.deleted)
        return next(
            new NotFoundException("Message not found", ErrorCode.USER_NOT_FOUND)
        );

    const isMessageOwner = message.memberId === member.id;
    if (!isMessageOwner)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "You can only edit your own messages",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const updatedMessage = await db.message.update({
        where: { id: messageId },
        data: { content },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    emitToChannel(channelId, "message:update", updatedMessage);

    res.json(updatedMessage);
};

export const deleteMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const { messageId } = req.params;
    const channelId = req.query.channelId?.toString();
    const serverId = req.query.serverId?.toString();

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!messageId || !channelId || !serverId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Message ID, Channel ID, and Server ID are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const server = await db.server.findFirst({
        where: {
            id: serverId,
            members: {
                some: { profileId: profile.id },
            },
        },
        include: { members: true },
    });

    if (!server)
        return next(
            new NotFoundException("Server not found", ErrorCode.NO_SERVER_FOUND)
        );

    const member = server.members.find((m) => m.profileId === profile.id);

    if (!member)
        return next(
            new NotFoundException("Member not found", ErrorCode.USER_NOT_FOUND)
        );

    const message = await db.message.findFirst({
        where: {
            id: messageId,
            channelId,
        },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    if (!message || message.deleted)
        return next(
            new NotFoundException("Message not found", ErrorCode.USER_NOT_FOUND)
        );

    const isMessageOwner = message.memberId === member.id;
    const isAdmin = member.role === "ADMIN";
    const isModerator = member.role === "MODERATOR";
    const canDelete = isMessageOwner || isAdmin || isModerator;

    if (!canDelete)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "You cannot delete this message",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const updatedMessage = await db.message.update({
        where: { id: messageId },
        data: {
            deleted: true,
            content: "This message has been deleted.",
            fileUrl: null,
        },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    emitToChannel(channelId, "message:update", updatedMessage);

    res.json(updatedMessage);
};
