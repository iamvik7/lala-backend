const { Router } = require("express");
const {
  addBrand,
} = require("../../../../controller/v1/Admin/Brand/brand.controller");

const brandRouter = Router();

brandRouter.post("/add", addBrand);

module.exports = brandRouter;
