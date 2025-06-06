import { model, Schema, Types } from 'mongoose';

export type EntryDocument = {
    _id: string;
    journalEntryId: Types.ObjectId;
    accountId: Types.ObjectId;
    amount: number;
    currency: string;
    description: string;
    type: 'credit' | 'debit';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

const EntrySchema = new Schema({
    journalEntryId: {
        type: Types.ObjectId,
        ref: 'JournalEntry',
        default: null
    },
    accountId: {
        type: Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

EntrySchema.index({ journalEntryId: 1 });

export const Entry = model<EntryDocument>('Entry', EntrySchema, 'entries');