const { Router } = require('express');
const {
  isAuthenticated,
} = require('../../../../../brain/middleware/isAuthenticated');
const AccessControlMiddleware = require('../../../../../brain/middleware/accessControl.middleware');
const {
  RBAC_RESOURCES,
  RBAC_ACTIONS,
} = require('../../../../../brain/utils/enums');
const {
  createOrderFromCart,
  getSpecificOrder,
  getAllOrders,
  cancelOrder,
} = require('../../../../controller/v1/User/Order/order.controller');

const userOrderRouter = Router();

userOrderRouter.post(
  '/add',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.ORDER
    ),
  ],
  createOrderFromCart
);

userOrderRouter.get(
  '/get/all',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_OWN,
      RBAC_RESOURCES.ORDER
    ),
  ],
  getAllOrders
);

userOrderRouter.get(
  '/get/:orderId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_OWN,
      RBAC_RESOURCES.ORDER
    ),
  ],
  getSpecificOrder
);

userOrderRouter.put(
  '/cancel/:orderId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.ORDER
    ),
  ],
  cancelOrder
);

module.exports = userOrderRouter;
