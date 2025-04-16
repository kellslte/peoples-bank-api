import Joi from "joi";

export const transactionSchema = Joi.object({
    amount: Joi.number().positive().required(),
    accountNumber: Joi.string().required(),
    description: Joi.string().max(255).required(),
    currency: Joi.string().valid("USD", "NGN").required(),
});

export const transferSchema = Joi.object({
    amount: Joi.number().positive().required(),
    fromAccountNumber: Joi.string().required(),
    toAccountNumber: Joi.string().required(),
    description: Joi.string().max(255).required(),
    currency: Joi.string().valid("USD", "NGN").required(),
});

