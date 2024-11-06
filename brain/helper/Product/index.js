const { createProduct } = require('./addProduct');
const { updateProductHelper } = require('./updateProduct');

exports.productService = {
  createProduct,
  updateProductHelper,
};
