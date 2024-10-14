const { default: mongoose } = require("mongoose");
const brandDesign = require("./brand.design");

const brandSchema = new mongoose.Schema(brandDesign, { timestamps: true });

module.exports = mongoose.model("Brand", brandSchema);
