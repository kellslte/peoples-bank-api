import { Request } from "express";

export enum AccountType {
    SAVINGS = 'savings',
    CHECKING = 'checking',
    CURRENT = 'current',
    FIXED_DEPOSIT = 'fixed_deposit',
}

export enum AccountTier {
    TIER_1 = 'tier_1',
    TIER_2 = 'tier_2',
    TIER_3 = 'tier_3',
}

export type AuthRequest = Request & {
    user: {
        sub: string;
        email: string;
        name: string;
        account: {
            type: AccountType;
            balance: number;
            currency: 'USD' | 'NGN';
            accountNumber: string;
            accountName: string;
        }
    }
}