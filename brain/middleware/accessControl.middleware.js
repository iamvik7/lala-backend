const logger = require("../utils/winston");
const Permissions = require("../rbac");
const {
  serverErrorResponse,
  unauthorizedResponse,
} = require("../utils/response");

const checkAccess = (action, resource) => {
  return async (req, res, next) => {
    try {
      // * get persmission for resource's action for user's role
      const resourceActionPermission = Permissions.can(req.user.role)[action](
        resource
      );

      // * If permission is not granted, return unAuthorized response
      if (!resourceActionPermission.granted) {
        return unauthorizedResponse({
          res,
          error: `You don't have permission to perform this action`,
        });
      }

      next();
    } catch (err) {
      logger.error(`Error while checking access: ${err.message}.`);
      return serverErrorResponse({
        res,
        error: `Error while checking access: ${err.message}`,
      });
    }
  };
};

const AccessControlMiddleware = {
  checkAccess,
};

module.exports = AccessControlMiddleware;
