const { default: mongoose } = require("mongoose");
const productDesign = require("./product.schema");

const productSchema = new mongoose.Schema(productDesign, { timestamps: true });
module.exports = mongoose.model("Product", productSchema);
