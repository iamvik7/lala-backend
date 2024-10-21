const { Router } = require('express');
const {
	fetchSearchSuggestions,
	fetchSearchProducts,
} = require('../../../../controller/v1/User/Product/product.controller');

const userProductRouter = Router();

userProductRouter.post('', fetchSearchProducts);
userProductRouter.post(
	'/suggestions',
	fetchSearchSuggestions
);

module.exports = userProductRouter;
