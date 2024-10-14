const { Router } = require("express");
const {
  fetchSearchSuggestions,
} = require("../../../../controller/v1/User/Product/product.controller");

const userProductRouter = Router();

userProductRouter.post("/suggestions", fetchSearchSuggestions);

module.exports = userProductRouter;
