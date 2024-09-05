const { RBAC_RESOURCES } = require('../utils/enums');

module.exports = {
  [RBAC_RESOURCES.USER]: {
    "update:own": ["*"],
  },

};
