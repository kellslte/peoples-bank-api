import { EntryDocument } from '@/entry/entry.schema';
import { model, Schema, Types } from 'mongoose';

export type JournalDocument = {
    _id: Types.ObjectId;
    reference: string;
    description: string;
    date: Date;
    entries: Array<EntryDocument[]>;
    createdAt: Date;
    updatedAt: Date;
}

const JournalSchema = new Schema<JournalDocument>({
    reference: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    entries: [
        {
            type: Types.ObjectId,
            ref: 'Entry',
            required: true,
        },
    ],
}, { timestamps: true });

export const Journal = model<JournalDocument>('Journal', JournalSchema);