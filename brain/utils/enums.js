const USER_ROLES = {
	SUPERADMIN: 'superadmin',
	ADMIN: 'admin',
	USER: 'user',
};

const CATEGORY_IMAGES = {
	CATEGORY_LOGO: 'logo',
	CATEGORY_ICON: 'icon',
	ERROR_MESSAGE: 'Only one image can be uploaded at a time',
};

const PRODUCT_IMAGES = {
	IMAGES: 'images',
	ERROR_MESSAGE: 'Only five image can be uploaded at a time',
};

const BRAND_IMAGES = {
	BRAND_LOGO: 'logo',
	ERROR_MESSAGE: 'Only five image can be uploaded at a time',
};

const RBAC_ACTIONS = {
	CREATE_ANY: 'createAny',
	CREATE_OWN: 'createOwn',
	READ_ANY: 'readAny',
	READ_OWN: 'readOwn',
	UPDATE_ANY: 'updateAny',
	UPDATE_OWN: 'updateOwn',
	DELETE_ANY: 'deleteAny',
	DELETE_OWN: 'deleteOwn',
};

const ORDER_STATUS = {
	PROCESSING: 'processing',
	CONFIRMED: 'confirmed',
	DELIVERED: 'delivered',
	CANCELLED: 'cancelled',
};

const RBAC_RESOURCES = {
	USER: 'user',
	ADMIN: 'admin',
	CATEGORY: 'category',
	PRODUCT: 'product',
	CART: 'cart',
	ORDER: 'oder',
	ADDRESS: 'address',
	BRAND: 'brand',
	//   CATEGORY: 'category',
	//   DASHBOARD:'dashboard',
	//   PLAN:"plan",
};

module.exports = {
	USER_ROLES,
	RBAC_ACTIONS,
	RBAC_RESOURCES,
	ORDER_STATUS,
	CATEGORY_IMAGES,
	PRODUCT_IMAGES,
	BRAND_IMAGES,
};
