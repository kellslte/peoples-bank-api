import { JwtServiceProvider } from "@/common/providers/jwt.provider";
import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "@/lib/classes/http-status.class";
import { ForbiddenException } from "@/lib/classes/errors.class";
import { AuthRequest } from "@/lib/types";
import { JwtPayload } from "jsonwebtoken";

export default function authorizeUserAction() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = req.cookies.token;

        try {
            if (!token) throw new ForbiddenException("Invalid or missing token");
            
            const decodedToken = JwtServiceProvider.verify(token);
            (req as AuthRequest).user = {
                sub: decodedToken!.sub as string,
                email: (decodedToken! as JwtPayload).email,
                name: (decodedToken! as JwtPayload).name,
                account: (decodedToken! as JwtPayload).account
            };
            next();
        } catch (error) {
            next(error);
        }
    };
}