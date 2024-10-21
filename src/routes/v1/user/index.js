const { Router } = require('express');
const {
	isAuthenticated,
} = require('../../../../brain/middleware/isAuthenticated');
const {
	RBAC_ACTIONS,
	RBAC_RESOURCES,
} = require('../../../../brain/utils/enums');
const AccessControlMiddleware = require('../../../../brain/middleware/accessControl.middleware');
const {
	changePassword,
} = require('../../../controller/v1/User/user.controller');
const cartRouter = require('./cart');
const addressRouter = require('./address');
const userOrderRouter = require('./order');
const userProductRouter = require('./product');

const userRouter = Router();

userRouter.use('/cart', cartRouter);
userRouter.use('/address', addressRouter);
userRouter.use('/order', userOrderRouter);
userRouter.use('/products', userProductRouter);

userRouter.put(
	'/password',
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
