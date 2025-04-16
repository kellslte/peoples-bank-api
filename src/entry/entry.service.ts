import { Entry, EntryDocument } from "./entry.schema";

export class EntryService {
    public static async createEntryLogs(payload: Omit<EntryDocument, "_id" | "createdAt" | "updatedAt" | "deletedAt">) {
        // Validate: Entry must have one debit and one credit and the total must be equal
        

        const entry = new Entry(payload);
        await entry.save();
        return entry;
    }

    public static async getEntryById(id: string) {
        const entry = await Entry.findById(id);
        return entry;
    }

    public static async updateEntry(id: string, payload: Partial<EntryDocument>) {
        const entry = await Entry.findByIdAndUpdate(id, payload, { new: true });
        return entry;
    }

    public static async deleteEntry(id: string) {
        const entry = await Entry.findByIdAndDelete(id);
        return entry;
    }

    public static async getAllEntries() {
        const entries = await Entry.find();
        return entries;
    }

    public static async getEntriesByAccountId(accountId: string) {
        const entries = await Entry.find({ accountId });
        return entries;
    }
}