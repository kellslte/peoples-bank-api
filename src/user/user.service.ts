import { User, UserDocument } from "./user.schema";

export class UserService {
    public static async getUserById(id: string): Promise<UserDocument | null> {
        const user = await User.findById(id);
        return user;
    }

    public static async getUserByEmail(email: string): Promise<UserDocument | null> {
        const user = await User.findOne({ email });
        return user;
    }

    public static async createUser(userData: Partial<UserDocument>): Promise<UserDocument> {
        const user = new User(userData);
        await user.save();
        return user;
    }

    public static async updateUser(id: string, userData: Partial<UserDocument>): Promise<UserDocument | null> {
        const user = await User.findByIdAndUpdate(id, userData, { new: true });
        return user;
    }

    public static async deleteUser(id: string): Promise<UserDocument | null> {
        const user = await User.findByIdAndDelete(id);
        return user;
    }

    public static async getAllUsers(): Promise<UserDocument[]> {
        const users = await User.find();
        return users;
    }
}