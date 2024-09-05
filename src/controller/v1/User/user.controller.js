const Db = require("../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  notFoundResponse,
  successResponse,
} = require("../../../../brain/utils/response");

exports.changePassword = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { oldpassword, password } = req.body;
    if (!oldpassword || !password) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        message: "Old password and new password is required!",
      });
    }

    const [user, userError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.USERMODEL,
      id: req.user.id,
      session,
    });

    if (userError) {
      await session.abortTransaction();
      await session.endSession();
      return unprocessableEntityResponse({
        res,
        error: error.message || error,
      });
    }

    if (!user) {
      await session.abortTransaction();
      await session.endSession();
      res.clearCookie("token");
      return notFoundResponse({
        res,
        message: "Unable to change password kindly login again!",
      });
    }
    const isMatch = await user.verifyPassword(oldpassword);

    if (!isMatch) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        message: "Old password is incorrect!",
      });
    }

    if (oldpassword === password) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        message: "Old password and new password same!",
      });
    }

    user.password = password;
    user.save(session);

    await session.commitTransaction();
    await session.endSession();

    return successResponse({
      res,
      data: "Password changed successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      message: "Error changing password!",
      error: error.message || error,
    });
  }
};
