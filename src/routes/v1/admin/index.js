const { Router } = require("express");
const {
  isAuthenticated,
} = require("../../../../brain/middleware/isAuthenticated");
const AccessControlMiddleware = require("../../../../brain/middleware/accessControl.middleware");
const {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} = require("../../../../brain/utils/enums");
const {
  getAllUsers,
} = require("../../../controller/v1/Admin/User/admin.user.controller");
const categoryRouter = require("./category");
const productRouter = require("./product");

const adminRouter = Router();

adminRouter.use("/category", categoryRouter);
adminRouter.use("/product", productRouter);

adminRouter.post(
  "/users",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.USER
    ),
  ],
  getAllUsers
);

module.exports = adminRouter;
