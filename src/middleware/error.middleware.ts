import { ValidationException } from "@/lib/classes/errors.class";
import type { NextFunction, Request, Response } from "express";

export default function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ValidationException) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  }

  const status = error.statusCode ? error.statusCode : 500;

  res.status(status).json({
    success: false,
    message: error.message || "An unexpected error occurred",
  });
}
