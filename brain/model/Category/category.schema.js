const { default: mongoose } = require('mongoose');

const categoryDesign = {
	name: {
		type: String,
		trim: true,
		required: true,
		lowercase: true,
	},
	logo: Object,
	icon: Object,
	parent: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Category',
		default: null,
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
};

module.exports = categoryDesign;
