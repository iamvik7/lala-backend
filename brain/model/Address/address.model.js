const { default: mongoose } = require('mongoose');
const addressDesign = require('./address.schema');

const addressSchema = new mongoose.Schema(addressDesign, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
