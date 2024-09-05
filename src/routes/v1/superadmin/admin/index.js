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
  createAdmin,
} = require("../../../../controller/v1/Admin/User/admin.user.controller");

const adminUpdateRouter = Router();

adminUpdateRouter.post(
  "/create",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_ANY,
      RBAC_RESOURCES.ADMIN
    ),
  ],
  createAdmin
);


module.exports = adminUpdateRouter;