import { ValidationException } from "@/lib/classes/errors.class";
import { HttpStatus } from "@/lib/classes/http-status.class";
import type { NextFunction, Request, Response } from "express";

export default function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ValidationException) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  const status = error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;

  res.status(status).json({
    success: false,
    message: error.message || "An unexpected error occurred",
  });
  return;
}
