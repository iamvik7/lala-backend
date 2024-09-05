const Joi = require("joi");

const registervalidator = Joi.object({
  firstname: Joi.string().required().messages({
    "any.required": "Enter the first name.",
    "string.empty": "UserName can not be empty.",
  }),
  lastname: Joi.string().required().messages({
    "any.required": "Enter the last name.",
    "string.empty": "UserName can not be empty.",
  }),
  phone: Joi.string()
    .required()
    .pattern(
      /\b\d{10}\b/
    )
    .messages({
      "any.required": "Enter the phone number",
      "string.pattern.base": "Only 10 digit numbers are allowed.",
      "string.empty": "phone number can not be empty.",
    }),
  email: Joi.string()
    .required()

    .pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .messages({
      "string.pattern.base": "Enter a valid email address.",
      "any.required": "Email address cannot be empty.",
    }),
  password: Joi.string()
    .required()
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)

    .messages({
      "string.pattern.base":
        "In the given pattern, one alphabet must be capital, one special character, and one number.",
      "any.required": "Password must not be empty.",
    }),
});
exports.userSchema = {
  registervalidator,
};
