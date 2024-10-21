const Joi = require('joi');

const createAddressValidator = Joi.object({
	recipent: Joi.string().required().messages({
		'any.required': 'Enter the recipent name.',
		'string.empty': 'Recipent name can not be empty.',
	}),
	phone: Joi.string()
		.required()
		.pattern(/\b\d{10}\b/)
		.messages({
			'any.required': 'Enter the phone number',
			'string.pattern.base': 'Only 10 digit numbers are allowed.',
			'string.empty': 'phone number can not be empty.',
		}),
	house: Joi.string().required().messages({
		'any.required': 'Enter the house/shop number.',
		'string.empty': 'House/shop number can not be empty.',
	}),
	street: Joi.string().required().messages({
		'any.required': 'Enter the street name.',
		'string.empty': 'Street name can not be empty.',
	}),
	landmark: Joi.string().required().messages({
		'any.required': 'Enter the landmark name.',
		'string.empty': 'Landmark name can not be empty.',
	}),
	zipcode: Joi.string()
		.required()
		.pattern(/\b\d{6}\b/)
		.messages({
			'any.required': 'Enter the zip code',
			'string.pattern.base': 'Only 6 digit zip codes are allowed.',
			'string.empty': 'Zip code can not be empty.',
		}),
});

const updateAddressValidator = Joi.object({
	recipent: Joi.string().optional().messages({
		'any.required': 'Enter the recipent name.',
		'string.empty': 'Recipent name can not be empty.',
	}),
	phone: Joi.string()
		.pattern(/\b\d{10}\b/)
		.optional()
		.messages({
			'any.required': 'Enter the phone number',
			'string.pattern.base': 'Only 10 digit numbers are allowed.',
			'string.empty': 'phone number can not be empty.',
		}),
	house: Joi.string().optional().messages({
		'any.required': 'Enter the house/shop number.',
		'string.empty': 'House/shop number can not be empty.',
	}),
	street: Joi.string().optional().messages({
		'any.required': 'Enter the street name.',
		'string.empty': 'Street name can not be empty.',
	}),
	landmark: Joi.string().optional().messages({
		'any.required': 'Enter the landmark name.',
		'string.empty': 'Landmark name can not be empty.',
	}),
	zipcode: Joi.string()
		.optional()
		.pattern(/\b\d{6}\b/)
		.messages({
			'any.required': 'Enter the zip code',
			'string.pattern.base': 'Only 6 digit zip codes are allowed.',
			'string.empty': 'Zip code can not be empty.',
		}),
});

exports.addressValidationSchema = {
	createAddressValidator,
	updateAddressValidator,
};
