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
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategoryImage,
  getSpeicificCategory,
  categoryDropdown,
} = require('../../../../controller/v1/Admin/Category/category.controller');

const categoryRouter = Router();

categoryRouter.post(
  '/add',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.CREATE_OWN,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  addCategory
);
categoryRouter.post(
  '/all',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  getAllCategories
);
categoryRouter.post(
  '/dropdown',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  categoryDropdown
);

categoryRouter.put(
  '/update/:categoryId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  updateCategory
);

categoryRouter.delete(
  '/image/:id/:uuid',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.UPDATE_OWN,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  deleteCategoryImage
);

categoryRouter.get(
  '/:categoryId',
  [
    isAuthenticated,
    AccessControlMiddleware.checkAccess(
      RBAC_ACTIONS.READ_ANY,
      RBAC_RESOURCES.CATEGORY
    ),
  ],
  getSpeicificCategory
);
module.exports = categoryRouter;
