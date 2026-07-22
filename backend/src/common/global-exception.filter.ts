import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  buildRequestLogPayload,
  errorMessage,
  firstErrorLine,
  formatLogBody,
} from "./http-log.util";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? this.httpExceptionMessage(exception)
        : errorMessage(exception);

    const route = req.originalUrl ?? req.url;
    const body = formatLogBody(buildRequestLogPayload(req));
    const errLine = firstErrorLine(exception);

    // eslint-disable-next-line no-console
    console.error(`${req.method} ${route} ${status} ${body} ${errLine}`);

    if (res.headersSent) {
      return;
    }

    res.status(status).json({ error: message });
  }

  private httpExceptionMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object" && response !== null && "message" in response) {
      const msg = (response as { message: unknown }).message;
      if (Array.isArray(msg)) {
        return msg.map(String).join(", ");
      }
      return String(msg);
    }
    return exception.message;
  }
}
