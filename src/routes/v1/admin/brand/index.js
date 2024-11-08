const { Router } = require('express');
const {
  addBrand,
  updateBrand,
  deleteBrandImage,
  getAllBrands,
  getSpeicificBrand,
  brandDropdown,
} = require('../../../../controller/v1/Admin/Brand/brand.controller');
const {
  isAuthenticated,
} = require('../../../../../brain/middleware/isAuthenticated');
const AccessControlMiddleware = require('../../../../../brain/middleware/accessControl.middleware');
const {
  RBAC_ACTIONS,
  RBAC_RESOURCES,
} = require('../../../../../brain/utils/enums');

const brandRouter = Router();

brandRouter.post(
  '/add',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.BRAND
    ),
  ],
  addBrand
);

brandRouter.put(
  '/update/:id',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.BRAND
    ),
  ],
  updateBrand
);

brandRouter.get(
  '/get/all',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.BRAND
    ),
  ],
  getAllBrands
);

brandRouter.get(
  '/dropdown',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.BRAND
    ),
  ],
  brandDropdown
);

brandRouter.get(
  '/get/:brandId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.BRAND
    ),
  ],
  getSpeicificBrand
);

brandRouter.delete(
  '/image/:id/:uuid',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.BRAND
    ),
  ],
  deleteBrandImage
);

module.exports = brandRouter;
