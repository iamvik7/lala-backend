const { Router } = require("express");
const {
  isAuthenticated,
} = require("../../../../brain/middleware/isAuthenticated");
const {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} = require("../../../../brain/utils/enums");
const AccessControlMiddleware = require("../../../../brain/middleware/accessControl.middleware");
const {
  changePassword,
} = require("../../../controller/v1/User/user.controller");

const userRouter = Router();

userRouter.put(
  "/password",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.USER
    ),
  ],
  changePassword
);

module.exports = userRouter;
