// This file contains constants used throughout the application.

import { AccountTier } from "./types";

// These constants are used to define the maximum and minimum transaction limits for different account types.
export const TRANSACTION_CHARGE = 0.02; // 2% transaction charge

export const DAILY_TRANSACTION_LIMITS = {
    [AccountTier.TIER_1]: {
        NGN: 50000, // NGN50,000
        USD: 1000, // $1,000
    },
    [AccountTier.TIER_2]: {
        NGN: 500000, // NGN500,000
        USD: 10000, // $10,000
    },
    [AccountTier.TIER_3]: {
        NGN: 5000000, // NGN5,000,000
        USD: 100000, // $100,000
    },
};

// Maximum Account Balance
// These limits are set to comply with the regulatory requirements for different account types.
export const MAX_ACCOUNT_BALANCE = {
    [AccountTier.TIER_1]: {
        NGN: 1000000, // NGN1,000,000
        USD: 10000, // $10,000
    },
    [AccountTier.TIER_2]: {
        NGN: 5000000, // NGN5,000,000
        USD: 50000, // $50,000
    },
    [AccountTier.TIER_3]: {
        NGN: 10000000, // NGN10,000,000
        USD: 100000, // $100,000
    },
};
