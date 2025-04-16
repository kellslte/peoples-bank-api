import { AccountService } from "@/account/account.service";
import { JornalEntryService } from "@/journal-entry/journal-entry.service";
import { EntryService } from "@/entry/entry.service";
import { Transaction, TransactionDocument } from "./transaction.schema";
import { startSession } from "mongoose";
import {
    TRANSACTION_CHARGE,
    NGN_TIER_1_DAILY_TRANSACTION_LIMIT,
    NGN_TIER_2_DAILY_TRANSACTION_LIMIT,
    USD_TIER_1_DAILY_TRANSACTION_LIMIT,
    USD_TIER_2_DAILY_TRANSACTION_LIMIT
} from "@/lib/constants";
import { ForbiddenException, NotFoundException } from "@/lib/classes/errors.class";
import { AccountTier } from "@/lib/types";
import { AccountDocument } from "@/account/account.schema";

type TDeposit = Pick<TransactionDocument, "amount" | "description"> & {
    accountNumber: string;
    currency: "NGN" | "USD";
}


export class TransactionService {
    public static async makeDeposit(payload: TDeposit) {
        // check if the account exists
        const account = await AccountService.getAccountByAccountNumber(payload.accountNumber);

        // throw an error if the account does not exist
        if (!account) throw new NotFoundException("Account not found");

        // check the account type to see if it can receive the deposit currency
        const accountCurrency = account.currency;
        if (accountCurrency !== payload.currency) throw new ForbiddenException("Account currency does not match deposit currency");

        // check if the account is active
        if (account.deletedAt) throw new ForbiddenException("Account is not active");

        // check if the account has reached its daily transaction limit
        this.verifyTransactionLimit(account, payload.amount);

        // create a new transaction
        const session = await startSession();
        session.startTransaction();
        try {
            const transaction = new Transaction({
                transaction_type: "credit",
                amount: payload.amount,
                description: payload.description,
                accountId: account._id
            });
            await transaction.save({ session });
            // update the account balance
            AccountService.updateAccount(account._id, {
                balance: account.balance + payload.amount
            }, session);
            // create a journal entry
            // await JornalEntryService.createJournalEntry({
            //     debitAccountId: null,
            //     creditAccountId: account._id,
            //     amount: payload.amount,
            //     description: payload.description,
            //     transactionId: transaction._id
            // }, session);
            await session.commitTransaction();
            return transaction;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static withdrawFunds() { }

    public static makeTransfer() { }

    private static async verifyTransactionLimit(account: AccountDocument, amount: number) {
        const dailyTransactionLimit = account.accountTier === AccountTier.TIER_1 ?
            (account.currency === "NGN" ? NGN_TIER_1_DAILY_TRANSACTION_LIMIT : USD_TIER_1_DAILY_TRANSACTION_LIMIT) : (account.currency === "NGN" ? NGN_TIER_2_DAILY_TRANSACTION_LIMIT : USD_TIER_2_DAILY_TRANSACTION_LIMIT);
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const transactions = await Transaction.find({
            accountId: account._id,
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });
        const totalTransactionAmount = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
        if (totalTransactionAmount + amount > dailyTransactionLimit) throw new ForbiddenException("Daily transaction limit exceeded");
        // check if the account has sufficient balance
        if (account.balance + amount > dailyTransactionLimit) throw new ForbiddenException("Daily transaction limit exceeded");
    }
}
