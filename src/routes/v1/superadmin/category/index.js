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
	deleteCategory,
	categoryRestore,
} = require('../../../../controller/v1/SuperAdmin/Category/categoryBin.controller');

const superadminCategoryRouter = Router();

superadminCategoryRouter.delete(
	'/delete/:categoryId',
	[
		isAuthenticated,
		AccessControlMiddleware.checkAccess(
			RBAC_ACTIONS.DELETE_ANY,
			RBAC_RESOURCES.CATEGORY
		),
	],
	deleteCategory
);
superadminCategoryRouter.post(
	'/restore/:categoryId',
	[
		isAuthenticated,
		AccessControlMiddleware.checkAccess(
			RBAC_ACTIONS.CREATE_ANY,
			RBAC_RESOURCES.CATEGORY
		),
	],
	categoryRestore
);
module.exports = superadminCategoryRouter;
