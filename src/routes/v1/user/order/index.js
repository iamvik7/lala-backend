const { Router } = require("express");
const {
  isAuthenticated,
} = require("../../../../../brain/middleware/isAuthenticated");
const AccessControlMiddleware = require("../../../../../brain/middleware/accessControl.middleware");
const {
  RBAC_RESOURCES,
  RBAC_ACTIONS,
} = require("../../../../../brain/utils/enums");
const {
  createOrderFromCart,
} = require("../../../../controller/v1/User/Order/order.controller");

const userOrderRouter = Router();

userOrderRouter.post(
  "/add",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.ORDER
    ),
  ],
  createOrderFromCart
);

module.exports = userOrderRouter;
