import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { UserDocument } from "@/user/user.schema";
import { AccountDocument } from "@/account/account.schema";
import { UserService } from "@/user/user.service";
import { AccountService } from "@/account/account.service";
import DatabaseProvider from "./database.provider";

type TUser = Omit<UserDocument, "_id" | "createdAt" | "updatedAt" | "deletedAt">;
type TAccount = Omit<AccountDocument, "_id" | "createdAt" | "updatedAt" | "deletedAt">;

interface ISystemData {
    user: TUser;
    accounts: TAccount[];
}


(async () => {
    const databaseInstance = DatabaseProvider.getInstance();
    try {
        // connect to the database
        databaseInstance.connect();
        console.info("Seeding system data...");
        // get the json data from the data file
        const seederData = await readFile(join(process.cwd(), "src", "common", "providers", "database/data", "system-data.json"), "utf-8");
        // parse the json data
        const parsedData = JSON.parse(seederData);
        const { user, accounts }: ISystemData = parsedData[0];

        const userRecord = await UserService.createUser(user);

        await Promise.all(
            accounts.map(async (account) => {
                const newAccount = {
                    ...account,
                    user: userRecord._id
                };

                await AccountService.createAccount(newAccount);
            }
            ));
        // close the database connection
        databaseInstance.disconnect();
        console.info("Database connection closed");
        console.log("System data seeded successfully");
    } catch (error) {
        console.error((error as Error).message);
        console.error("Error seeding system data");
        // close the database connection
        databaseInstance.disconnect();
        console.info("Database connection closed");
        // exit the process with a failure code
        process.exit(1)
    }
})();