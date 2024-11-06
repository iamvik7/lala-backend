const { Router } = require('express');
const {
  isAuthenticated,
} = require('../../../../../brain/middleware/isAuthenticated');
const AccessControlMiddleware = require('../../../../../brain/middleware/accessControl.middleware');
const {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} = require('../../../../../brain/utils/enums');
const {
  addProduct,
  getSpecificProduct,
  updateProduct,
  deleteProductImage,
  getAllProducts,
  deleteProduct,
  restoreProduct,
} = require('../../../../controller/v1/Admin/Product/product.controller');
const productRouter = Router();

productRouter.post(
  '/add',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  addProduct
);

productRouter.put(
  '/update/:productId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  updateProduct
);

productRouter.delete(
  '/image/:productId/:uuid',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  deleteProductImage
);

productRouter.delete(
  '/delete/:productId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.DELETE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  deleteProduct
);

productRouter.post(
  '/restore/:productId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  restoreProduct
);

productRouter.get(
  '/get/all',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.PRODUCT
    ),
  ],
  getAllProducts
);

productRouter.get(
  '/get/:productId',
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
