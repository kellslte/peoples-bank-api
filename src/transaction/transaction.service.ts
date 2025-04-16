import { AccountService } from "@/account/account.service";
import { JornalEntryService } from "@/journal-entry/journal-entry.service";
import { Transaction, TransactionDocument } from "./transaction.schema";
import { ClientSession, startSession } from "mongoose";
import {
    TRANSACTION_CHARGE,
    DAILY_TRANSACTION_LIMITS,
    MAX_ACCOUNT_BALANCE,
} from "@/lib/constants";
import { ForbiddenException, NotFoundException } from "@/lib/classes/errors.class";
import { AccountTier } from "@/lib/types";
import { AccountDocument } from "@/account/account.schema";
import { v4 as uuidv4 } from "uuid";

type TTransaction = Pick<TransactionDocument, "amount" | "description"> & {
    accountNumber: string;
    currency: "NGN" | "USD";
}

type TTransferTransaction = Pick<TransactionDocument, "amount" | "description"> & {
    fromAccountNumber: string;
    toAccountNumber: string;
    currency: "NGN" | "USD";
}

type TransactionType = "deposit" | "withdrawal" | "transfer";

export class TransactionService {
    private static async validateAccount(accountNumber: string, currency: "NGN" | "USD"): Promise<AccountDocument> {
        const account = await AccountService.getAccountByAccountNumber(accountNumber);
        if (!account) throw new NotFoundException("Account not found");
        if (account.currency !== currency) throw new ForbiddenException("Account currency does not match transaction currency");
        if (account.deletedAt) throw new ForbiddenException("Account is not active");
        return account;
    }

    private static async createTransaction(
        type: "credit" | "debit",
        amount: number,
        description: string,
        accountId: string,
        session: ClientSession
    ): Promise<TransactionDocument> {
        const transaction = new Transaction({
            transaction_type: type,
            amount,
            description,
            accountId,
            transaction_reference: uuidv4()
        });
        await transaction.save({ session });
        return transaction;
    }

    private static async createJournalEntry(
        reference: string,
        description: string,
        debit: { accountId: string; amount: number; currency: string; description: string },
        credit: { accountId: string; amount: number; currency: string; description: string },
        session: ClientSession
    ) {
        await JornalEntryService.createJournalEntry({
            reference,
            description,
            debit,
            credit
        }, session);
    }

    private static async updateAccountBalance(
        accountId: string,
        amount: number,
        operation: "add" | "subtract",
        session: ClientSession
    ) {
        const account = await AccountService.getAccountByAccountNumber(accountId);
        const newBalance = operation === "add"
            ? account!.balance + amount
            : account!.balance - amount;
        await AccountService.updateAccount(account!._id, { balance: newBalance }, session);
    }

    private static async verifyTransactionLimit(account: AccountDocument, amount: number, transactionType: TransactionType) {
        if (account.accountTier === AccountTier.TIER_3) return;

        const dailyTransactionLimit = DAILY_TRANSACTION_LIMITS[account.accountTier as keyof typeof DAILY_TRANSACTION_LIMITS][account.currency as keyof typeof DAILY_TRANSACTION_LIMITS[keyof typeof DAILY_TRANSACTION_LIMITS]];
        const maxAccountBalance = MAX_ACCOUNT_BALANCE[account.accountTier as keyof typeof MAX_ACCOUNT_BALANCE][account.currency as keyof typeof MAX_ACCOUNT_BALANCE[keyof typeof MAX_ACCOUNT_BALANCE]];
        const transactionCharge = amount * TRANSACTION_CHARGE;

        // Check balance limits
        if (transactionType === "withdrawal" && account.balance < amount + transactionCharge)
            throw new ForbiddenException("Insufficient funds");
        if (transactionType === "deposit" && account.balance + amount > maxAccountBalance)
            throw new ForbiddenException("Account balance limit exceeded");
        if (transactionType === "transfer" && account.balance < amount + transactionCharge)
            throw new ForbiddenException("Insufficient funds");

        // Check daily transaction limit
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const transactions = await Transaction.find({
            accountId: account._id,
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });
        const totalTransactionAmount = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
        if (totalTransactionAmount + amount > dailyTransactionLimit)
            throw new ForbiddenException("Daily transaction limit exceeded");
    }

    private static async getSystemAccountByCurrency(currency: "NGN" | "USD") {
        const accountName = currency === 'NGN' ? "Peoples Bank Naira Deposits Account" : "Peoples Bank Dollar Deposits Account";
        return await AccountService.getSystemAccountByAccountName(accountName);
    }

    public static async makeDeposit(payload: TTransaction) {
        const session = await startSession();
        session.startTransaction();
        try {
            const account = await this.validateAccount(payload.accountNumber, payload.currency);
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            this.verifyTransactionLimit(account, payload.amount, "deposit");

            const bankTransaction = await this.createTransaction(
                "debit",
                payload.amount,
                payload.description,
                systemAccount!._id,
                session
            );

            const customerTransaction = await this.createTransaction(
                "credit",
                payload.amount,
                payload.description,
                account._id,
                session
            );

            await this.updateAccountBalance(account._id, payload.amount, "add", session);
            await this.updateAccountBalance(systemAccount!._id, payload.amount, "subtract", session);

            await this.createJournalEntry(
                customerTransaction.transaction_reference,
                payload.description,
                {
                    accountId: systemAccount!._id,
                    amount: payload.amount + TRANSACTION_CHARGE,
                    currency: payload.currency,
                    description: payload.description
                },
                {
                    accountId: account._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                session
            );

            await session.commitTransaction();
            return customerTransaction;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static async withdrawFunds(payload: TTransaction) {
        const session = await startSession();
        session.startTransaction();
        try {
            const account = await this.validateAccount(payload.accountNumber, payload.currency);
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            this.verifyTransactionLimit(account, payload.amount, "withdrawal");

            const bankTransaction = await this.createTransaction(
                "credit",
                payload.amount,
                payload.description,
                systemAccount!._id,
                session
            );

            const customerTransaction = await this.createTransaction(
                "debit",
                payload.amount,
                payload.description,
                account._id,
                session
            );

            await this.updateAccountBalance(account._id, payload.amount, "subtract", session);
            await this.updateAccountBalance(systemAccount!._id, payload.amount, "add", session);

            await this.createJournalEntry(
                customerTransaction.transaction_reference,
                payload.description,
                {
                    accountId: account._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                {
                    accountId: systemAccount!._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                session
            );

            await this.performBankChargeTransaction(payload.amount, account, systemAccount!, session);
            await session.commitTransaction();
            return customerTransaction;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static async makeTransfer(payload: TTransferTransaction) {
        const session = await startSession();
        session.startTransaction();
        try {
            const fromAccount = await this.validateAccount(payload.fromAccountNumber, payload.currency);
            const toAccount = await this.validateAccount(payload.toAccountNumber, payload.currency);
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            this.verifyTransactionLimit(fromAccount, payload.amount, "transfer");

            // First leg of transfer (from account to system)
            const bankTransaction1 = await this.createTransaction(
                "credit",
                payload.amount,
                payload.description,
                systemAccount!._id,
                session
            );

            const customerTransaction1 = await this.createTransaction(
                "debit",
                payload.amount,
                payload.description,
                fromAccount._id,
                session
            );

            await this.updateAccountBalance(fromAccount._id, payload.amount, "subtract", session);
            await this.updateAccountBalance(systemAccount!._id, payload.amount, "add", session);

            await this.createJournalEntry(
                customerTransaction1.transaction_reference,
                payload.description,
                {
                    accountId: fromAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                {
                    accountId: toAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                session
            );

            // Second leg of transfer (system to to account)
            const bankTransaction2 = await this.createTransaction(
                "debit",
                payload.amount,
                payload.description,
                systemAccount!._id,
                session
            );

            const customerTransaction2 = await this.createTransaction(
                "credit",
                payload.amount,
                payload.description,
                toAccount._id,
                session
            );

            await this.updateAccountBalance(toAccount._id, payload.amount, "add", session);
            await this.updateAccountBalance(systemAccount!._id, payload.amount, "subtract", session);

            await this.createJournalEntry(
                customerTransaction2.transaction_reference,
                payload.description,
                {
                    accountId: toAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                {
                    accountId: fromAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                session
            );

            await session.commitTransaction();
            return customerTransaction1;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    private static async performBankChargeTransaction(
        amount: number,
        account: AccountDocument,
        systemAccount: AccountDocument,
        session: ClientSession
    ) {
        const transactionAmount = amount * TRANSACTION_CHARGE;

        const bankTransaction = await this.createTransaction(
            "credit",
            transactionAmount,
            "Bank Charge",
            systemAccount._id,
            session
        );

        const customerTransaction = await this.createTransaction(
            "debit",
            transactionAmount,
            "Bank Charge",
            account._id,
            session
        );

        await this.updateAccountBalance(account._id, transactionAmount, "subtract", session);
        await this.updateAccountBalance(systemAccount._id, transactionAmount, "add", session);

        await this.createJournalEntry(
            customerTransaction.transaction_reference,
            "Bank Charge",
            {
                accountId: account._id,
                amount: transactionAmount,
                currency: account.currency,
                description: "Bank Charge"
            },
            {
                accountId: systemAccount._id,
                amount: transactionAmount,
                currency: account.currency,
                description: "Bank Charge"
            },
            session
        );
    }

    public static async getTransactionHistory(accountNumber: string, startDate: string, endDate: string) {
        const account = await this.validateAccount(accountNumber, "NGN"); // Currency check not critical for history
        return await Transaction.find({
            accountId: account._id,
            createdAt: {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            }
        }).populate("accountId");
    }

    public static async getTransactionDetails(accountNumber: string, transactionId: string) {
        const account = await this.validateAccount(accountNumber, "NGN"); // Currency check not critical for details
        const transaction = await Transaction.findOne({
            _id: transactionId,
            accountId: account._id
        }).populate("accountId");

        if (!transaction) throw new NotFoundException("Transaction not found");
        return transaction;
    }
}
