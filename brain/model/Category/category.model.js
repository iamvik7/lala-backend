const { mongoose } = require('mongoose');
const categoryDesign = require('./category.schema');

const categorySchema = new mongoose.Schema(categoryDesign, {
	timestamps: true,
});

categorySchema.pre('save', async function (next) {
	if (this.isModified('name')) {
		const existing = await this.constructor.findOne({
			name: this.name.toLowerCase(),
			_id: { $ne: this._id },
		});
		if (existing) {
			throw new Error(`${this.name}: Category already exists.`);
		}
	}
	next();
});

categorySchema.pre('findOneAndUpdate', async function (next) {
	const update = this.getUpdate();
	if (update.$set && update.$set.name) {
		const existing = await this.model.findOne({
			name: update.$set.name.toLowerCase(),
			_id: { $ne: this._conditions._id },
		});
		if (existing) {
			throw new Error(`${update.$set.name}: Category already exists.`);
		}
	}
	next();
});

categorySchema.index({ name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
