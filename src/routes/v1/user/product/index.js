const { Router } = require('express');
const {
  fetchSearchSuggestions,
  fetchSearchProducts,
  fetchClosestProducts,
} = require('../../../../controller/v1/User/Product/product.controller');

const userProductRouter = Router();

userProductRouter.post('', fetchSearchProducts);
userProductRouter.post('/suggestions', fetchSearchSuggestions);
userProductRouter.post('/closest', fetchClosestProducts);

module.exports = userProductRouter;
