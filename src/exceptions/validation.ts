import { ErrorCode, HttpException } from "./root";

export class NotFoundException extends HttpException {
  constructor(error: any, message: string, errorCode: ErrorCode) {
    super(message, errorCode, 422, null);
  }
}
