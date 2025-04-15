import { AccountType } from '@/lib/types';
import { model, Schema, Types } from 'mongoose';

export type AccountDocument = {
    _id: string;
    user: Types.ObjectId;
    balance: number;
    currency: string;
    accountNumber: string;
    accountName: string;
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
    },
    accountType: {
        type: String,
        enum: Object.values(AccountType),
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true,
    },
    accountName: {
        type: String,
        required: true,
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