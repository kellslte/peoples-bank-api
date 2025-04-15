import { model, Schema, Types } from 'mongoose';

export type UserDocument = {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    dateOfBirth: Date;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    zipCode: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

UserSchema.index({ createdAt: 1 });
UserSchema.index({ updatedAt: 1 });
UserSchema.index({ deletedAt: 1 });

export const User = model<UserDocument>('User', UserSchema, 'users');