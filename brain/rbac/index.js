const AccessControl = require('accesscontrol');
const fs = require('fs');
const path = require('path');
const { USER_ROLES } = require('../utils/enums');

const basename = path.basename(__filename);

let permissions = {};

try {
  const files = fs.readdirSync(__dirname).filter(
    (file) =>
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  );
  files.forEach((file) => {
    const roleName = file.split('.')[0];

    try {
      const rolePermissions = require(path.join(__dirname, file));

      permissions[roleName] = rolePermissions;
    } catch (err) {
      console.error('Error loading permissions for role:', roleName, err);
    }
  });

} catch (err) {
  console.error('Error reading directory or processing files:', err);
}

// * create access control object from created permissions json
const ac = new AccessControl(permissions);

console.log("Access Control object created:", ac);

// * user inherits its own permissions
ac.grant(USER_ROLES.USER)

// * admin inherits its own permissions and from user
ac.grant(USER_ROLES.ADMIN).extend(USER_ROLES.USER);

// * super admin inherits all permissions from admin
ac.grant(USER_ROLES.SUPERADMIN).extend([USER_ROLES.ADMIN]);

module.exports = ac;
