import { AccountType } from "@/lib/types";
import Joi from "joi";

export const createUserAccountSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    firstName: Joi.string().min(1).max(30).required(),
    lastName: Joi.string().min(1).max(30).required(),
    phoneNumber: Joi.string().pattern(/^(\+?[0-9]{1,3}[- ]?)?[0-9]{3}[- ]?[0-9]{3}[- ]?[0-9]{4}$/).required(),
    address: Joi.string().min(5).max(100).required(),
    city: Joi.string().min(1).max(30).required(),
    state: Joi.string().min(1).max(30).required(),
    country: Joi.string().min(1).max(30).required(),
    zipCode: Joi.string().pattern(/^[0-9]{5}$/).required(),
    dateOfBirth: Joi.date().less('1-1-2004').required(),
    accountType: Joi.string().valid(...Object.values(AccountType)).required(),
    currency: Joi.string().valid("USD", "NGN").required(),
});

export const authenticateUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(30).required(),
});