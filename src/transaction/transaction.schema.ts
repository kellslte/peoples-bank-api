import { generateCryptographicallyRandomString } from '@/lib/utils';
import { model, Schema, Types } from 'mongoose';

export type TransactionDocument = {
    _id: Types.ObjectId;
    transaction_reference: string;
    transaction_type: 'debit' | 'credit';
    amount: number;
    description: string;
    accountId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    deletedat: Date | null;
}

const TransactionSchema = new Schema<TransactionDocument>({
    transaction_reference: {
        type: String,
        required: true,
        unique: true,
        default: generateCryptographicallyRandomString(16)
    },
    transaction_type: {
        type: String,
        enum: ['debit', 'credit'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    accountId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
}, { timestamps: true, collection: 'transactions' });

export const Transaction = model<TransactionDocument>('Transaction', TransactionSchema, 'transactions');