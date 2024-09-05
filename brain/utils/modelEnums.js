const userModel = require("../model/User/user.model");
const categoryModel = require("../model/Category/category.model");
const categoryBinModel = require("../model/Category/category.bin.model");
const productModel = require("../model/Product/product.model");
const productBinModel = require("../model/Product/product.bin.model");

exports.COLLECTIONS = {
  USER_COLLECTION: "users",
  CATEGORY_COLLECTION: "categories",
  CATEGORY_BIN_COLLECTION: "categorybins",
  PRODUCT_COLLECTION: "products",
  PRODUCT_BIN_COLLECTION: "productbins",
};

exports.DB_MODELS = {
  userModel: userModel,
  categoryModel: categoryModel,
  categoryBinModel: categoryBinModel,
  productModel: productModel,
  productBinModel: productBinModel,
};

exports.COLLECTION_NAMES = {
  USERMODEL: "userModel",
  CATEGORYMODEL: "categoryModel",
  CATEGORYBINMODEL: "categoryBinModel",
  PRODUCTMODEL: "productModel",
  PRODUCTBINMODEL: "productBinModel"
};
