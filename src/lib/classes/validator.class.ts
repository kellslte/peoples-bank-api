import Joi from "joi";

class Validator {
  validate<T>(schema: Joi.Schema<T>, requestBody: T) {
    const errors: Record<string, string> = {};

    const { error, value } = schema.validate(requestBody, { abortEarly: false });

    if (error) {
      error.details.forEach(({ path, message }) => {
        errors[path.join(".")] = message; // Join path to create a proper key
      });
    }

    return {
      errors: Object.keys(errors).length > 0 ? errors : null,
      value,
    };
  }
}

export default new Validator();
