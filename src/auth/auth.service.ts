import { JwtServiceProvider } from "@/common/providers/jwt.provider";
import { UnauthenticatedException } from "@/lib/classes/errors.class";
import { UserDocument } from "@/user/user.schema";
import { UserService } from "@/user/user.service";
import { AccountService } from "@/account/account.service";
import argon from 'argon2';
import { AccountType } from "@/lib/types";

type TUserAccount = Omit<UserDocument, "_id"> & {
    accountType: AccountType;
    currency: 'USD' | 'NGN';
}

export class AuthService {
    /**
     * Create a new user account
     * @param payload - The payload containing user details and account information
     * @returns The created user object
     */
    public static createUserAccount = async (payload: TUserAccount) => {
        const user = await UserService.createUser(payload);

        // create an account for the user
        await AccountService.createAccount({
            user: user._id,
            accountType: payload.accountType,
            currency: payload.currency,
            accountName: `${user.firstName} ${user.lastName}`,
        });

        return user;
    }
    
    /**
     * Authenticate a user
     * @param payload - The payload containing the user's email and password
     * @returns A JWT token if the user is authenticated successfully
     * @throws UnauthenticatedException if the user is not found or the password is incorrect
     */
    public static authenticateUser = async (payload: Pick<UserDocument, "email" | "password">) => {
        const user = await UserService.getUserByEmail(payload.email);

        if (!user) throw new UnauthenticatedException("Invalid email or password");

        const isPasswordValid = await argon.verify(user.password, payload.password);

        if (!isPasswordValid) throw new UnauthenticatedException("Invalid email or password");

        // fetch  the user's account details
        const account = await AccountService.getAccountByUserId(user._id.toString());

        return JwtServiceProvider.sign({
            sub: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            account: {
                type: account?.accountType,
                balance: account?.balance,
                currency: account?.currency,
                accountNumber: account?.accountNumber,
                accountName: account?.accountName,
            }
        })
    }
    
    /**
     * Get user details
     * @param userId - The ID of the user to fetch details for
     * @returns The user details if found
     * @throws UnauthenticatedException if the user is not found
     */
    public static getUserDetails = async (userId: string) => {
        const user = await UserService.getUserById(userId);

        if (!user) throw new UnauthenticatedException("User not found");

        return user;
    }


    /**
     * Refresh the JWT token
     * @param token - The JWT token to refresh
     * @throws UnauthenticatedException if the token is invalid or expired
     * @returns A new JWT token
     */
    public static refreshToken = async (token: string) => {
        const decoded = JwtServiceProvider.verify(token);

        if (!decoded) throw new UnauthenticatedException("Invalid token");

        const user = await UserService.getUserById(decoded.sub as string);

        if (!user) throw new UnauthenticatedException("Invalid or missing token");

        const account = await AccountService.getAccountByUserId(user._id.toString());

        return JwtServiceProvider.sign({
            sub: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            account: {
                type: account?.accountType,
                balance: account?.balance,
                currency: account?.currency,
                accountNumber: account?.accountNumber,
                accountName: account?.accountName,
            }
        })
     }
 }