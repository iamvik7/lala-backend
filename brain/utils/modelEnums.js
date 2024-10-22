const userModel = require('../model/User/user.model');
const categoryModel = require('../model/Category/category.model');
const categoryBinModel = require('../model/Category/category.bin.model');
const productModel = require('../model/Product/product.model');
const productBinModel = require('../model/Product/product.bin.model');
const cartModel = require('../model/Cart/cart.model');
const orderModel = require('../model/Order/order.model');
const addressModel = require('../model/Address/address.model');
const brandModel = require('../model/Brand/brand.model');
const searchKeywordModel = require('../model/SearchKeyword/searchKeyword.model');

exports.COLLECTIONS = {
  USER_COLLECTION: 'users',
  CATEGORY_COLLECTION: 'categories',
  CATEGORY_BIN_COLLECTION: 'categorybins',
  PRODUCT_COLLECTION: 'products',
  PRODUCT_BIN_COLLECTION: 'productbins',
  CART_COLLECTION: 'carts',
  ORDER_COLLECTION: 'orders',
  ADDRESS_COLLECTION: 'addresses',
  BRAND_COLLECTION: 'brands',
  SEARCH_KEYWORD_COLLECTION: 'searchkeywords',
};

exports.DB_MODELS = {
  userModel: userModel,
  categoryModel: categoryModel,
  categoryBinModel: categoryBinModel,
  productModel: productModel,
  productBinModel: productBinModel,
  cartModel: cartModel,
  orderModel: orderModel,
  addressModel: addressModel,
  brandModel: brandModel,
  searchKeywordModel: searchKeywordModel,
};

exports.COLLECTION_NAMES = {
  USERMODEL: 'userModel',
  CATEGORYMODEL: 'categoryModel',
  CATEGORYBINMODEL: 'categoryBinModel',
  PRODUCTMODEL: 'productModel',
  PRODUCTBINMODEL: 'productBinModel',
  CARTMODEL: 'cartModel',
  ORDERMODEL: 'orderModel',
  ADDRESSMODEL: 'addressModel',
  BRANDMODEL: 'brandModel',
  SEARCHKEYWORDMODEL: 'searchKeywordModel',
};
