const { RBAC_RESOURCES } = require('../utils/enums');

module.exports = {
	[RBAC_RESOURCES.USER]: {
		'create:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*'],
	},
	[RBAC_RESOURCES.ADMIN]: {
		'create:any': ['*'],
		'read:any': ['*'],
		'update:any': ['*'],
		'delete:any': ['*'],
	},
	[RBAC_RESOURCES.CATEGORY]: {
		'create:any': ['*'],
		'delete:any': ['*'],
	},
};
