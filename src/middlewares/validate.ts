import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { errorHandler } from "../errorHandler";
import { UnprocessbleEntity } from "../exceptions/bad-requests";
import { ErrorCode } from "../exceptions/root";

const handleValidationErrors = errorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        new UnprocessbleEntity(
          errors.array(),
          "Invalid data",
          ErrorCode.UNPROCESSABLE_ENTITY
        )
      );
    }
  }
);

export const validateUserRequest = [
  body("id").isString().notEmpty().withMessage("Id must be provided"),
  body("name").isString().notEmpty().withMessage("Name must be provided"),
  body("imageUrl")
    .isString()
    .notEmpty()
    .withMessage("ImageUrl must be provided"),
  body("email").isString().notEmpty().withMessage("Email must be provided"),
];

export const validateServerRequest = [
  body("name")
    .isString()
    .isLength({ min: 5 })
    .notEmpty()
    .withMessage("Name must be provided"),
];
