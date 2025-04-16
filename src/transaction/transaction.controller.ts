import { TransactionService } from "./transaction.service";
import { asyncWrapper } from "@/lib/utils";
import { ForbiddenException, ValidationException } from "@/lib/classes/errors.class";
import type { Request, Response } from "express";
import { HttpStatus } from "@/lib/classes/http-status.class";
import validatorClass from "@/lib/classes/validator.class";
import { transactionSchema, transferSchema } from "./transaction.request";

export class TransactionController {
    public static transactionHistory = asyncWrapper(
        async (req: Request, res: Response): Promise<Response> => {
            const { accountNumber } = req.params;
            const { startDate, endDate } = req.query;

            if (!accountNumber) throw new ForbiddenException("Account number is required");

            const transactions = await TransactionService.getTransactionHistory(
                accountNumber,
                startDate as string,
                endDate as string
            );

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Transaction history retrieved successfully",
                data: transactions,
            });
        });
    
    public static transactionDetails = asyncWrapper(
        async (req: Request, res: Response): Promise<Response> => {
            const { accountNumber, transactionId } = req.params;

            if (!accountNumber || !transactionId) throw new ForbiddenException("Account number and transaction ID are required");

            const transaction = await TransactionService.getTransactionDetails(accountNumber, transactionId);

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Transaction details retrieved successfully",
                data: transaction,
            });
         });

    public static transferFunds = asyncWrapper(
        async (req: Request, res: Response): Promise<Response> => {
            const { errors, value } = validatorClass.validate(transferSchema, req.body);

            if (errors) throw new ValidationException("The request failed with the following errors", errors);

            const transaction = await TransactionService.makeTransfer(value);

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Funds transferred successfully",
                data: transaction,
            });
        });

    public static withdrawFunds = asyncWrapper(
        async (req: Request, res: Response): Promise<Response> => {
            const { errors, value } = validatorClass.validate(transactionSchema, req.body);

            if (errors) throw new ValidationException("The request failed with the following errors", errors);

            const transaction = await TransactionService.withdrawFunds(value);

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Funds withdrawn successfully",
                data: transaction,
            });
        });

    public static depositFunds = asyncWrapper(
        async (req: Request, res: Response): Promise<Response> => {
            const { errors, value } = validatorClass.validate(transactionSchema, req.body);

            if (errors) throw new ValidationException("The request failed with the following errors", errors);

            const transaction = await TransactionService.makeDeposit(value);

            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Funds deposited successfully",
                data: transaction,
            });
        });
}