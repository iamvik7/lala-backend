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
  addAddress,
  getAllAddresses,
  updateAddress,
  deleteAddress,
  getSpecificAddress,
} = require("../../../../controller/v1/User/Address/address.controller");

const addressRouter = Router();

addressRouter.post(
  "/add",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.ADDRESS
    ),
  ],
  addAddress
);

addressRouter.get(
  "/get",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_OWN,
      RBAC_RESOURCES.ADDRESS
    ),
  ],
  getAllAddresses
);

addressRouter.get(
  "/get/:addressId",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_OWN,
      RBAC_RESOURCES.ADDRESS
    ),
  ],
  getSpecificAddress
);

addressRouter.put(
  "/update/:addressId",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.ADDRESS
    ),
  ],
  updateAddress
);

addressRouter.delete(
  "/delete/:addressId",
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.DELETE_OWN,
      RBAC_RESOURCES.ADDRESS
    ),
  ],
  deleteAddress
);

module.exports = addressRouter;
