const { mongoose } = require('mongoose');

const searchKeywordSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SearchKeyword', searchKeywordSchema);
