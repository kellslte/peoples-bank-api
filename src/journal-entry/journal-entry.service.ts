import { Journal, JournalDocument } from "./journal-entry.schema";
import { ClientSession } from "mongoose";
import { Entry } from "@/entry/entry.schema";

type TJournalEntry = {
    reference: string;
    description: string;
    debit: {
        accountId: string;
        amount: number;
        currency: string;
        description: string;
    };
    credit: {
        accountId: string;
        amount: number;
        currency: string;
        description: string;
    };
}

export class JornalEntryService {
    public static createJournalEntry = async (payload: TJournalEntry, session: ClientSession): Promise<JournalDocument> => {
        const date = new Date();

        const debitEntry = new Entry({
            journalEntryId: null, // to be updated after the journal entry is created
            accountId: payload.debit.accountId,
            type: "debit",
            amount: payload.debit.amount,
            currency: payload.debit.currency,
            description: payload.debit.description,
            date,
        });

        const creditEntry = new Entry({
            journalEntryId: null, // to be updated after the journal entry is created
            accountId: payload.credit.accountId,
            type: "credit",
            amount: payload.credit.amount,
            currency: payload.credit.currency,
            description: payload.credit.description,
            date,
        });

        //  save the entries
        await debitEntry.save({ session });
        await creditEntry.save({ session });

        // create the journal entry
        const journalEntry = new Journal({
            reference: payload.reference,
            description: payload.description,
            date,
            entries: [debitEntry._id, creditEntry._id],
        });
        await journalEntry.save({ session });
        // update the entries with the journal entry id
        await Entry.updateMany(
            { _id: { $in: [debitEntry._id, creditEntry._id] } },
            { journalEntryId: journalEntry._id },
            { session }
        )

        return journalEntry;
    }
}