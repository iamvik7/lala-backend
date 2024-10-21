const Joi = require('joi');

const categoryValidator = Joi.object({
	name: Joi.string().required().allow(null).messages({
		'any.required': 'Enter the category name.',
		'string.empty': 'Category name can not be empty.',
	}),
	parent: Joi.string().allow(null).optional(),
});

const updateCategoryValidator = Joi.object({
	name: Joi.string().required().optional().messages({
		'any.required': 'Enter the category name.',
		'string.empty': 'Category name can not be empty.',
	}),
	logo: Joi.string().required().optional().messages({
		'any.required': 'Enter the logo url.',
		'string.empty': 'Logo url can not be empty.',
	}),
});

exports.categorySchema = {
	categoryValidator,
	updateCategoryValidator,
};
