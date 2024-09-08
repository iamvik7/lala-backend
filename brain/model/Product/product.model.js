const { default: mongoose } = require("mongoose");
const productDesign = require("./product.schema");

const productSchema = new mongoose.Schema(productDesign, { timestamps: true });

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.name) {
    const existing = await this.model.findOne({
      name: update.$set.name.toLowerCase(),
      _id: { $ne: this._conditions._id },
    });
    if (existing) {
      throw new Error(`${update.$set.name}: Product already exists.`);
    }
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
