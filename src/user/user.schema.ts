import { model, Schema, Types } from 'mongoose';
import argon from 'argon2';

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
    dateOfBirth: {
        type: Date,
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

//  hash the password before commiting it to the database
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await argon.hash(this.password);
    }
    next();
});

// setup soft deletes


UserSchema.index({ createdAt: 1 });
UserSchema.index({ updatedAt: 1 });
UserSchema.index({ deletedAt: 1 });

export const User = model<UserDocument>('User', UserSchema, 'users');