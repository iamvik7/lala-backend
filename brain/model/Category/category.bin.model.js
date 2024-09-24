const { mongoose } = require("mongoose");
const categoryDesign = require("./category.schema");

const categorySchema = new mongoose.Schema(categoryDesign, {
  timestamps: true,
});

module.exports = mongoose.model("CategoryBin", categorySchema);
