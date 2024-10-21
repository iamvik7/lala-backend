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
	addToCart,
	removeFromCart,
	getCartitems,
} = require('../../../../controller/v1/User/Cart/cart.controller');

const cartRouter = Router();

cartRouter.post(
	'/add',
	[
		isAuthenticated,
		AccessControlMiddleware.checkAccess(
			RBAC_ACTIONS.CREATE_OWN,
			RBAC_RESOURCES.CART
		),
	],
	addToCart
);

cartRouter.delete(
	'/delete',
	[
		isAuthenticated,
		AccessControlMiddleware.checkAccess(
			RBAC_ACTIONS.DELETE_OWN,
			RBAC_RESOURCES.CART
		),
	],
	removeFromCart
);

cartRouter.get(
	'/get',
	[
		isAuthenticated,
		AccessControlMiddleware.checkAccess(
			RBAC_ACTIONS.READ_OWN,
			RBAC_RESOURCES.CART
		),
	],
	getCartitems
);

module.exports = cartRouter;
