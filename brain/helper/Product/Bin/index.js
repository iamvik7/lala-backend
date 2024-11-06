const { deleteProductHelper } = require('./productDelete');
const { restoreProductHelper } = require('./restoreProduct');

const productBinHelper = {
  deleteProductHelper,
  restoreProductHelper,
};

module.exports = productBinHelper;
