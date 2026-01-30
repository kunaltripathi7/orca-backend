import { NextFunction, Request, Response } from "express";
import { currentProfile } from "../utils";
import { NotFoundException } from "../exceptions/not-found";
import { ErrorCode } from "../exceptions/root";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { db } from "../clients/prismaClient";

export const getOrCreateConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const memberOneId = req.query.memberOneId?.toString();
    const memberTwoId = req.query.memberTwoId?.toString();

    if (!profile)
        return next(
            new NotFoundException("User Profile Not found", ErrorCode.USER_NOT_FOUND)
        );

    if (!memberOneId || !memberTwoId)
        return next(
            new UnprocessbleEntity(
                new Error(),
                "Both member IDs are required",
                ErrorCode.UNPROCESSABLE_ENTITY
            )
        );

    let conversation = await findConversation(memberOneId, memberTwoId);

    if (!conversation) {
        conversation = await createConversation(memberOneId, memberTwoId);
    }

    res.json(conversation);
};

const findConversation = async (memberOneId: string, memberTwoId: string) => {
    try {
        return await db.conversation.findFirst({
            where: {
                OR: [
                    { memberOneId, memberTwoId },
                    { memberOneId: memberTwoId, memberTwoId: memberOneId },
                ],
            },
            include: {
                memberOne: {
                    include: { profile: true },
                },
                memberTwo: {
                    include: { profile: true },
                },
            },
        });
    } catch {
        return null;
    }
};

const createConversation = async (memberOneId: string, memberTwoId: string) => {
    try {
        return await db.conversation.create({
            data: {
                memberOneId,
                memberTwoId,
            },
            include: {
                memberOne: {
                    include: { profile: true },
                },
                memberTwo: {
                    include: { profile: true },
                },
            },
        });
    } catch {
        return null;
    }
};

export const getConversationById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const profile = await currentProfile(req);
    const { conversationId } = req.params;

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

    res.json(conversation);
};
