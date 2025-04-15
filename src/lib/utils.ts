import { NextFunction, Request, Response } from "express";

export function asyncWrapper(callback: Function) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await callback(req, res);
    } catch (error) {
      next(error);
    }
  };
}

export function convertHumanReadableTimeToMilliseconds(timestring: string) {
  //  time format can be like this: "90d" | "1h" | "3w"
  const match = timestring.match(/^(\d+)(\w+)$/);
  if (!match) {
    throw new Error(
      'Invalid time format. Expected format: "90d" | "1h" | "3w"'
    );
  }

  const number = parseInt(match[1], 10);
  const unit = match[2];
  console.log(number, unit);

  let milliseconds;
  switch (unit) {
    case "ms":
      milliseconds = number;
      break;
    case "s":
      milliseconds = number * 1000;
      break;
    case "m":
      milliseconds = number * 60 * 1000;
      break;
    case "h":
      milliseconds = number * 60 * 60 * 1000;
      break;
    case "d":
      milliseconds = number * 24 * 60 * 60 * 1000;
      break;
    case "w":
      milliseconds = number * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      throw new Error(
        "Invalid time unit. Expected units: ms | s | m | h | d | w"
      );
  }

  return milliseconds;
}

export function generateAlphanumericKey(length: number) {
  const characters = "ABCDEFGHIJKLNOPQURSTUVXYZ123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateAccountNumber() {
  const characters = "1234567890";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}