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

type TTransaction = Pick<TransactionDocument, "amount" | "description"> & {
    accountNumber: string;
    currency: "NGN" | "USD";
}

type TTransferTransaction = Pick<TransactionDocument, "amount" | "description"> & {
    fromAccountNumber: string;
    toAccountNumber: string;
    currency: "NGN" | "USD";
}

export class TransactionService {
    public static async makeDeposit(payload: TTransaction) {
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
        this.verifyTransactionLimit(account, payload.amount, "deposit");

        // create a new transaction
        const session = await startSession();
        session.startTransaction();
        try {
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            // perform in-house transaction
            const bankTransaction = new Transaction({
                transaction_type: "debit",
                amount: payload.amount,
                description: payload.description,
                accountId: systemAccount!._id
            });

            // perform customer transaction
            const customerTransaction = new Transaction({
                transaction_type: "credit",
                amount: payload.amount,
                description: payload.description,
                accountId: account._id
            });

            await bankTransaction.save({ session });
            await customerTransaction.save({ session });
            // update the account balance
            await AccountService.updateAccount(account._id, {
                balance: account.balance + payload.amount
            }, session);
            // create a journal entry
            await JornalEntryService.createJournalEntry({
                reference: customerTransaction.toObject().transaction_reference,
                description: payload.description,
                debit: {
                    accountId: systemAccount!._id,
                    amount: payload.amount + TRANSACTION_CHARGE,
                    currency: payload.currency,
                    description: payload.description
                },
                credit: {
                    accountId: account._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                }
            }, session);
            await session.commitTransaction();
            return customerTransaction;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static async withdrawFunds(payload: TTransaction) {
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
        this.verifyTransactionLimit(account, payload.amount, "withdrawal");

        // create a new transaction
        const session = await startSession();
        session.startTransaction();

        try {
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            // perform in-house transaction
            const bankTransaction = new Transaction({
                transaction_type: "credit",
                amount: payload.amount,
                description: payload.description,
                accountId: systemAccount!._id
            });

            // perform customer transaction
            const customerTransaction = new Transaction({
                transaction_type: "debit",
                amount: payload.amount,
                description: payload.description,
                accountId: account._id
            });

            await bankTransaction.save({ session });
            await customerTransaction.save({ session });
            // update the account balance
            await AccountService.updateAccount(account._id, {
                balance: account.balance - payload.amount
            }, session);
            // create a journal entry
            await JornalEntryService.createJournalEntry({
                reference: customerTransaction.toObject().transaction_reference,
                description: payload.description,
                debit: {
                    accountId: account._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                credit: {
                    accountId: systemAccount!._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                }
            }, session);

            await this.performBankChargeTransaction(payload.amount, account, systemAccount!, session);
            await session.commitTransaction();
            return customerTransaction;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static async makeTransfer(payload: TTransferTransaction) {
        // check if the account exists
        const fromAccount = await AccountService.getAccountByAccountNumber(payload.fromAccountNumber);
        const toAccount = await AccountService.getAccountByAccountNumber(payload.toAccountNumber);

        // throw an error if the account does not exist
        if (!fromAccount) throw new NotFoundException("Account not found");
        if (!toAccount) throw new NotFoundException("Receipient account does not exist");

        // check the account type to see if it can receive the deposit currency
        const fromAccountCurrency = fromAccount.currency;
        const toAccountCurrency = toAccount.currency;
        if (fromAccountCurrency !== payload.currency) throw new ForbiddenException("User account currency does not match transfer currency");
        if (toAccountCurrency !== payload.currency) throw new ForbiddenException("Receipient account currency does not match transfer currency");

        // check if the account is active
        if (fromAccount.deletedAt) throw new ForbiddenException("User account is not active");
        if (toAccount.deletedAt) throw new ForbiddenException("Recepient account is not active");

        // check if the account has reached its daily transaction limit
        this.verifyTransactionLimit(fromAccount, payload.amount, "transfer");

        // create a new transaction
        const session = await startSession();
        session.startTransaction();

        try {
            const systemAccount = await this.getSystemAccountByCurrency(payload.currency);

            // perform in-house transaction
            const bankTransaction = new Transaction({
                transaction_type: "credit",
                amount: payload.amount,
                description: payload.description,
                accountId: systemAccount!._id
            });

            // perform customer transaction
            const customerTransaction = new Transaction({
                transaction_type: "debit",
                amount: payload.amount,
                description: payload.description,
                accountId: fromAccount._id
            });

            await bankTransaction.save({ session });
            await customerTransaction.save({ session });
            // update the from account balance
            await AccountService.updateAccount(fromAccount._id, {
                balance: fromAccount.balance - payload.amount
            }, session);
            // create a journal entry
            await JornalEntryService.createJournalEntry({
                reference: customerTransaction.toObject().transaction_reference,
                description: payload.description,
                debit: {
                    accountId: fromAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                credit: {
                    accountId: toAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                }
            }, session);

            // perform in-house transaction
            const bankTransaction2 = new Transaction({
                transaction_type: "debit",
                amount: payload.amount,
                description: payload.description,
                accountId: systemAccount!._id
            });

            // perform customer transaction
            const customerTransaction2 = new Transaction({
                transaction_type: "credit",
                amount: payload.amount,
                description: payload.description,
                accountId: toAccount._id
            });
            await bankTransaction2.save({ session });
            await customerTransaction2.save({ session });
            // update the to account balance
            await AccountService.updateAccount(toAccount._id, {
                balance: toAccount.balance + payload.amount
            }, session);
            // create a journal entry
            await JornalEntryService.createJournalEntry({
                reference: customerTransaction2.toObject().transaction_reference,
                description: payload.description,
                debit: {
                    accountId: toAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                },
                credit: {
                    accountId: fromAccount._id,
                    amount: payload.amount,
                    currency: payload.currency,
                    description: payload.description
                }
            }, session);
            // await this.performBankChargeTransaction(payload.amount, fromAccount, systemAccount!, session);
            await session.commitTransaction();
            return customerTransaction;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    }

    public static async getTransactionHistory(accountNumber: string, startDate: string, endDate: string) {
        // check if the account exists
        const account = await AccountService.getAccountByAccountNumber(accountNumber);

        // throw an error if the account does not exist
        if (!account) throw new NotFoundException("Account not found");

        // check if the account is active
        if (account.deletedAt) throw new ForbiddenException("Account is not active");

        const transactions = await Transaction.find({
            accountId: account._id,
            createdAt: {
                $gte: new Date(startDate),
                $lt: new Date(endDate)
            }
        }).populate("accountId");

        return transactions;
    }

    public static async getTransactionDetails(accountNumber: string, transactionId: string) {
        // check if the account exists
        const account = await AccountService.getAccountByAccountNumber(accountNumber);

        // throw an error if the account does not exist
        if (!account) throw new NotFoundException("Account not found");

        // check if the account is active
        if (account.deletedAt) throw new ForbiddenException("Account is not active");

        const transaction = await Transaction.findOne({
            _id: transactionId,
            accountId: account._id
        }).populate("accountId");

        if (!transaction) throw new NotFoundException("Transaction not found");

        return transaction;
     }

    private static async verifyTransactionLimit(account: AccountDocument, amount: number, transactionType: string) {
        if (account.accountTier === AccountTier.TIER_3) return;

        const dailyTransactionLimit = DAILY_TRANSACTION_LIMITS[account.accountTier as keyof typeof DAILY_TRANSACTION_LIMITS][account.currency as keyof typeof DAILY_TRANSACTION_LIMITS[keyof typeof DAILY_TRANSACTION_LIMITS]];
        const maxAccountBalance = MAX_ACCOUNT_BALANCE[account.accountTier as keyof typeof MAX_ACCOUNT_BALANCE][account.currency as keyof typeof MAX_ACCOUNT_BALANCE[keyof typeof MAX_ACCOUNT_BALANCE]];

        const transactionCharge = amount * TRANSACTION_CHARGE;


        if (transactionType === "withdrawal" && account.balance < amount + transactionCharge) throw new ForbiddenException("Insufficient funds");
        if (transactionType === "deposit" && account.balance + amount > maxAccountBalance) throw new ForbiddenException("Account balance limit exceeded");
        if (transactionType === "transfer" && account.balance < amount + transactionCharge) throw new ForbiddenException("Insufficient funds");
        if (transactionType === "transfer" && account.balance + amount + transactionCharge > maxAccountBalance) throw new ForbiddenException("Account balance limit exceeded");
        if (transactionType === "withdraw" && account.balance < amount + transactionCharge) throw new ForbiddenException("Insufficient funds");
        if (transactionType === "deposit" && account.balance + amount > maxAccountBalance) throw new ForbiddenException("Account balance limit exceeded");

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
    }

    private static async getSystemAccountByCurrency(currency: "NGN" | "USD") {
        const accountName = currency === 'NGN' ? "Peoples Bank Naira Deposits Account" : "Peoples Bank Dollar Deposits Account";
        return await AccountService.getSystemAccountByAccountName(accountName);
    }

    private static async performBankChargeTransaction(
        amount: number,
        account: AccountDocument,
        systemAccount: AccountDocument,
        session: ClientSession
    ) {
        const transactionAmount = amount * TRANSACTION_CHARGE;
        // perform in-house transaction
        const bankTransaction = new Transaction({
            transaction_type: "credit",
            amount: transactionAmount,
            description: "Bank Charge",
            accountId: systemAccount!._id
        });

        // perform customer transaction
        const customerTransaction = new Transaction({
            transaction_type: "debit",
            amount: transactionAmount,
            description: "Bank Charge",
            accountId: account._id
        });

        await bankTransaction.save({ session });
        await customerTransaction.save({ session });
        // update the account balance
        await AccountService.updateAccount(account._id, {
            balance: account.balance - transactionAmount
        }, session);
        // create a journal entry
        await JornalEntryService.createJournalEntry({
            reference: customerTransaction.toObject().transaction_reference,
            description: "Bank Charge",
            debit: {
                accountId: account._id,
                amount: TRANSACTION_CHARGE,
                currency: account.currency,
                description: "Bank Charge"
            },
            credit: {
                accountId: systemAccount!._id,
                amount: TRANSACTION_CHARGE,
                currency: account.currency,
                description: "Bank Charge"
            }
        }, session);
    }
}
