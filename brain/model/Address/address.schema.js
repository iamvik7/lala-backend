const { mongoose } = require('mongoose');

const addressDesign = {
	recipent: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	phone: {
		type: String,
		required: true,
		max: 10,
		trim: true,
	},
	house: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	street: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	landmark: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	zipcode: {
		type: Number,
		required: true,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
};

module.exports = addressDesign;
