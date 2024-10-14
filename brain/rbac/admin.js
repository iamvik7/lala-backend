const { RBAC_RESOURCES } = require("../utils/enums");

module.exports = {
  [RBAC_RESOURCES.USER]: {
    "read:any": ["*"],
  },
  [RBAC_RESOURCES.CATEGORY]: {
    "create:own": ["*"],
    "read:any": ["*"],
    "update:own": ["*"],
  },
  [RBAC_RESOURCES.PRODUCT]: {
    "create:own": ["*"],
    "read:any": ["*"],
    "update:own": ["*"],
  },
  [RBAC_RESOURCES.BRAND]: {
    "create:own": ["*"],
    "read:any": ["*"],
    "update:own": ["*"],
  },
};
