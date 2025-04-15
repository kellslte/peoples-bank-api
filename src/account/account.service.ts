import { Account, AccountDocument } from "./account.schema";

export class AccountService {
    public static createAccount = async (payload: Partial<AccountDocument>) => {
        const account = new Account(payload);
        await account.save();
        return account;
    };

    public static getAccountById = async (accountId: string) => {
        return await Account.findById(accountId);
    };

    public static getAccountByUserId = async (userId: string): Promise<AccountDocument|null> => {
        return await Account.findOne({ userId });
     }

    public static getAllAccounts = async () => {
        return await Account.find();
    };

    public static updateAccount = async (accountId: string, payload: Partial<AccountDocument>) => {
        return await Account.findByIdAndUpdate(accountId, payload, { new: true });
    };

    public static deleteAccount = async (accountId: string) => {
        return await Account.findByIdAndDelete(accountId);
    };
}