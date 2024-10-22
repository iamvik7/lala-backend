const { Router } = require('express');
const {
  extractSearchKeyword,
} = require('../../../../controller/v1/User/Product/product.controller');

const searchRouter = Router();

searchRouter.get('/extract', extractSearchKeyword);

module.exports = searchRouter;
