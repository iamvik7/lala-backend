const { Router } = require("express");
const {
  isAuthenticated,
} = require("../../../../../brain/middleware/isAuthenticated");
const AccessControlMiddleware = require("../../../../../brain/middleware/accessControl.middleware");
const {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} = require("../../../../../brain/utils/enums");
const {
  addProduct,
  getSpecificProduct,
} = require("../../../../controller/v1/Admin/Product/product.controller");
const productRouter = Router();

productRouter.post(
  "/add",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  addProduct
);

productRouter.get(
  "/get/:productId",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  getSpecificProduct
);
module.exports = productRouter;
