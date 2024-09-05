const { userService } = require("../../../../../brain/helper/User");
const Db = require("../../../../../brain/utils/db");
const { USER_ROLES } = require("../../../../../brain/utils/enums");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  unprocessableEntityResponse,
  notFoundResponse,
  successResponse,
  badRequestResponse,
} = require("../../../../../brain/utils/response");
const { userSchema } = require("../../../../joi/v1/User");
const ObjectId = require("mongoose").Types.ObjectId;

exports.getAllUsers = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    if (Number.isNaN(+limit) || Number.isNaN(+offset)) {
      return badRequestResponse({
        res,
        message: "Invalid limt and offset value!",
      });
    }
    const [users, usersError] = await Db.fetchAll({
      collection: COLLECTION_NAMES.USERMODEL,
      query: {
        _id: { $ne: new ObjectId(req.user.id) },
        ...(req.user.role === USER_ROLES.ADMIN
          ? { role: { $ne: USER_ROLES.SUPERADMIN } }
          : {}),
      },
      projection: { __v: 0, password: 0, createdAt: 0, updatedAt: 0 },
      options: { skip: offset, limit: limit}
    });

    if (usersError) {
      return unprocessableEntityResponse({
        res,
        error: usersError,
      });
    }

    if (users.lenth === 0) {
      return notFoundResponse({
        res,
        message: "Unable to find users or no users!",
      });
    }

    return successResponse({
      res,
      data: users,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      method: req.method,
      url: req.url,
      message: "Error while fetching all users!",
      error: error.message || error,
    });
  }
};

exports.createAdmin = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const valid = userSchema.registervalidator.validate(req.body, {
      abortEarly: true,
    });
    if (valid.error) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        error: valid.error.message,
      });
    }

    const [addUser, addUserError] = await userService.createUser(
      req.body,
      USER_ROLES.ADMIN,
      session
    );

    if (addUserError) {
      await session.abortTransaction();
      await session.endSession();
      return unprocessableEntityResponse({
        res,
        message: "Error while creating user!",
        error: addUserError.message || addUserError,
      });
    }

    await session.commitTransaction();
    await session.endSession();

    return successResponse({
      res,
      data: addUser,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while creating admin!",
      error: error.message || error,
    });
  }
};
