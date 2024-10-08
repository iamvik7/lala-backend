const { default: mongoose } = require("mongoose");

const brandDesign = {
  name: {
    type: String,
    required: true,
    lowercase: true,
  },
  logo: Object,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId,
};

module.exports = brandDesign;
