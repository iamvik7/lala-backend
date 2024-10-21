const { default: mongoose } = require('mongoose');
const productDesign = require('./product.schema');

const productBinSchema = new mongoose.Schema(productDesign, {
	timestamps: true,
});

module.exports = mongoose.model('ProductBin', productBinSchema);
