const { default: mongoose } = require("mongoose");
const productDesign = {
  name: {
    type: String,
    unique: [true, "Product already exist with this name!"],
    required: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
  },
  weight: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  sold: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  tags: {
    type: Array,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
};

module.exports = productDesign;
