import { AuthService } from "./auth.service";
import { asyncWrapper, convertHumanReadableTimeToMilliseconds } from "@/lib/utils";
import { ValidationException } from "@/lib/classes/errors.class";
import type { Request, Response } from "express";
import validatorClass from "@/lib/classes/validator.class";
import { authenticateUserSchema, createUserAccountSchema } from "./auth.request";
import { HttpStatus } from "@/lib/classes/http-status.class";
import configServiceClass from "@/lib/classes/config-service.class";
import { AuthRequest } from "@/lib/types";

export class AuthController {
    public static createUserAccount = asyncWrapper(
        async (req: Request, res: Response) => {
            const { value, errors } = validatorClass.validate(createUserAccountSchema, req.body);

            if (errors) throw new ValidationException("The request failed with the following errors", errors);

            await AuthService.createUserAccount(value);

            return res.status(HttpStatus.CREATED).json({
                success: true,
                message: "User account created successfully",
            });
        }
    );

    public static authenticateUser = asyncWrapper(
        async (req: Request, res: Response) => {

            const { value, errors } = validatorClass.validate(authenticateUserSchema, req.body);

            if (errors) throw new ValidationException("The request failed with the following errors", errors);

            const token = await AuthService.authenticateUser(value);

            res.cookie("token", token, {
                httpOnly: true,
                secure: configServiceClass.getEnvironment() === "production",
                sameSite: "strict",
                maxAge: convertHumanReadableTimeToMilliseconds(configServiceClass.getOrThrow('jwt_expires_in')), // 30 minutes
            });

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "User authenticated successfully"
            });
        }
    );

    public static getUserDetails = asyncWrapper(
        async (req: Request, res: Response) => {
            const authUser = (req as AuthRequest).user;
            const { password, ...user } = await AuthService.getUserDetails(authUser.sub);
            return res.status(HttpStatus.OK).json({
                success: true,
                message: "User details fetched successfully",
                data: user,
            });
        }
    );

    public static refreshToken = asyncWrapper(
        async (req: Request, res: Response) => {
            const token = req.cookies.token;

            if (!token) {
                return res.status(HttpStatus.UNAUTHORIZED).json({
                    success: false,
                    message: "No token provided",
                });
            }
            const newToken = await AuthService.refreshToken(token);
            res.cookie("token", newToken, {
                httpOnly: true,
                secure: configServiceClass.getEnvironment() === "production",
                sameSite: "strict",
                maxAge: convertHumanReadableTimeToMilliseconds(configServiceClass.getOrThrow('jwt_expires_in')), // 30 minutes
            });
            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Token refreshed successfully",
            });
        }
    );

    public static signOutUser = asyncWrapper(
        async (req: Request, res: Response) => {
            res.clearCookie("token");
            return res.status(HttpStatus.OK).json({
                success: true,
                message: "User signed out successfully",
            });
        }
    );
}