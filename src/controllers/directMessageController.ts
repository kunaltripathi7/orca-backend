import { NextFunction, Request, Response } from "express";
import { currentProfile } from "../utils";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { db } from "../clients/prismaClient";
import { emitToConversation } from "../socket";

const MESSAGES_BATCH = 10;

export const getDirectMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const conversationId = req.query.conversationId?.toString();
    const cursor = req.query.cursor?.toString();

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!conversationId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Conversation ID is required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    let messages;

    if (cursor) {
        messages = await db.directMessage.findMany({
            take: MESSAGES_BATCH,
            skip: 1,
            cursor: { id: cursor },
            where: { conversationId },
            include: {
                member: {
                    include: { profile: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } else {
        messages = await db.directMessage.findMany({
            take: MESSAGES_BATCH,
            where: { conversationId },
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

export const sendDirectMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const conversationId = req.query.conversationId?.toString();
    const { content, fileUrl } = req.body;

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!conversationId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Conversation ID is required",
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

    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
            memberOne: {
                include: { profile: true },
            },
            memberTwo: {
                include: { profile: true },
            },
        },
    });

    if (!conversation)
        return next(
            new NotFoundException("Conversation not found", ErrorCode.USER_NOT_FOUND)
        );

    const member = await db.member.findFirst({
        where: {
            profileId: profile.id,
            OR: [
                { id: conversation.memberOneId },
                { id: conversation.memberTwoId },
            ],
        },
    });

    if (!member)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "You are not part of this conversation",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const message = await db.directMessage.create({
        data: {
            content: content || "",
            fileUrl,
            conversationId,
            memberId: member.id,
        },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    emitToConversation(conversationId, "directMessage:new", message);

    res.json(message);
};

export const editDirectMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const { messageId } = req.params;
    const conversationId = req.query.conversationId?.toString();
    const { content } = req.body;

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!messageId || !conversationId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Message ID and Conversation ID are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation)
        return next(
            new NotFoundException("Conversation not found", ErrorCode.USER_NOT_FOUND)
        );

    const member = await db.member.findFirst({
        where: {
            profileId: profile.id,
            OR: [
                { id: conversation.memberOneId },
                { id: conversation.memberTwoId },
            ],
        },
    });

    if (!member)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "You are not part of this conversation",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const message = await db.directMessage.findFirst({
        where: {
            id: messageId,
            conversationId,
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

    const updatedMessage = await db.directMessage.update({
        where: { id: messageId },
        data: { content },
        include: {
            member: {
                include: { profile: true },
            },
        },
    });

    emitToConversation(conversationId, "directMessage:update", updatedMessage);

    res.json(updatedMessage);
};

export const deleteDirectMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const { messageId } = req.params;
    const conversationId = req.query.conversationId?.toString();

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!messageId || !conversationId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Message ID and Conversation ID are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
    });

    if (!conversation)
        return next(
            new NotFoundException("Conversation not found", ErrorCode.USER_NOT_FOUND)
        );

    const member = await db.member.findFirst({
        where: {
            profileId: profile.id,
            OR: [
                { id: conversation.memberOneId },
                { id: conversation.memberTwoId },
            ],
        },
    });

    if (!member)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "You are not part of this conversation",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const message = await db.directMessage.findFirst({
        where: {
            id: messageId,
            conversationId,
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
                "You can only delete your own messages",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    const updatedMessage = await db.directMessage.update({
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

    emitToConversation(conversationId, "directMessage:update", updatedMessage);

    res.json(updatedMessage);
};
