import { ErrorCode, HttpException } from "./root";

export class UnprocessbleEntity extends HttpException {
  constructor(error: any, message: string, errorCode: ErrorCode) {
    super(message, errorCode, 400, null);
  }
}

// in controller -> throw new BadRequestException("message", ErrorCode.fdsaf) , next(error) -> control is passed to the error middleware directly
