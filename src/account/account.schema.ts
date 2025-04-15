import { AccountTier, AccountType } from '@/lib/types';
import { generateAccountNumber } from '@/lib/utils';
import { model, Schema, Types } from 'mongoose';

export type AccountDocument = {
    _id: string;
    user: Types.ObjectId;
    balance: number;
    currency: string;
    accountNumber: string;
    accountName: string;
    accountTier: AccountTier;
    accountType: AccountType;
    createdAt: Date;
    deletedAt: Date | null;
    updatedAt: Date;
}

const AccountSchema = new Schema({
    user: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'NGN'],
        default: 'NGN'
    },
    accountType: {
        type: String,
        enum: Object.values(AccountType),
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
        default: generateAccountNumber(),
        unique: true,
    },
    accountName: {
        type: String,
        required: true,
    },
    accountTier: {
        type: String,
        enum: Object.values(AccountTier),
        default: AccountTier.TIER_1,
    },
    deletedAt: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

AccountSchema.index({ createdAt: 1 });
AccountSchema.index({ updatedAt: 1 });

export const Account = model<AccountDocument>('Account', AccountSchema, 'accounts');