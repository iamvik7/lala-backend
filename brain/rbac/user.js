const { RBAC_RESOURCES } = require("../utils/enums");

module.exports = {
  [RBAC_RESOURCES.USER]: {
    "update:own": ["*"],
  },
  [RBAC_RESOURCES.CART]: {
    "create:own": ["*"],
    "read:own": ["*"],
    "update:own": ["*"],
    "delete:own": ["*"],
  },
};
