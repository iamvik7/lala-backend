const Joi = require("joi");

const productValidator = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Enter the Product name.",
    "string.empty": "Product name can not be empty.",
  }),
  description: Joi.string().required().messages({
    "any.required": "Enter the description.",
    "string.empty": "Description can not be empty.",
  }),
  quantity: Joi.number(),
  weight: Joi.string().required().messages({
    "any.required": "Enter the weight.",
    "string.empty": "Weight can not be empty.",
  }),
  stock: Joi.number().required().messages({
    "any.required": "Enter the stock.",
    "number.empty": "Stock can not be empty.",
  }),
  images: Joi.array().required().messages({
    "any.required": "Insert product images.",
    "array.empty": "Images can not be empty.",
  }),
  categoryId: Joi.string().required().messages({
    "any.required": "Select the category.",
    "string.empty": "Category can not be empty.",
  }),
  brand: Joi.string().required().messages({
    "any.required": "Add the brand name.",
    "string.empty": "Brand name can not be empty.",
  }),
  price: Joi.number().required().messages({
    "any.required": "Enter the price.",
    "number.empty": "Price can not be empty.",
  }),
  tags: Joi.array().optional(),
});

module.exports.productSchema = {
  productValidator,
};
