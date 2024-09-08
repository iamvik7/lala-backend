const { mongoose } = require("mongoose");
const { COLLECTIONS } = require("../../utils/modelEnums");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
    },
    logo: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", async function (next) {
  if (this.isModified("name")) {
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

categorySchema.pre("findOneAndUpdate", async function (next) {
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
