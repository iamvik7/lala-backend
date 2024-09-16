const Db = require("../../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  successResponse,
} = require("../../../../../brain/utils/response");
const { addressValidationSchema } = require("../../../../joi/v1/Address");

exports.addAddress = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const valid = addressValidationSchema.createAddressValidator.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (valid.error) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: valid.error.message || valid.error,
      });
    }

    const [findAddress, findAddressError] = await Db.count({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      query: { userId: req.user.id },
    });

    if (findAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while fetching all addresses!",
        error: findAddressError.message || findAddressError,
      });
    }

    if (findAddress >= 5) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: "You can only add 5 address delete any one!",
      });
    }
    const [addAddress, addAddressError] = await Db.create({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      body: { ...req.body, userId: req.user.id },
      session,
    });
    if (addAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while adding address!",
        error: addAddressError.message || addAddressError,
      });
    }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      data: addAddress,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while adding address!",
      error: error.message || error,
    });
  }
};

exports.getSpecificAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const [findAddress, findAddressError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      query: { _id: addressId, userId: req.user.id },
      projection: { __v: 0, createdAt: 0, updatedAt: 0 },
    });

    if (findAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while fetching address!",
        error: findAddressError.message || findAddressError,
      });
    }
    if (!findAddress) {
      return badRequestResponse({
        res,
        message: "No addresses found for this adress id!",
      });
    }
    return successResponse({
      res,
      data: findAddress,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while fetching address!",
      error: error.message || error,
    });
  }
};

exports.getAllAddresses = async (req, res) => {
  try {
    const [findAddress, findAddressError] = await Db.fetchAll({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      query: { userId: req.user.id },
      projection: { __v: 0, createdAt: 0, updatedAt: 0 },
    });

    if (findAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while fetching all addresses!",
        error: findAddressError.message || findAddressError,
      });
    }
    if (findAddress?.length === 0) {
      return badRequestResponse({
        res,
        message: "No addresses added by the user!",
      });
    }
    return successResponse({
      res,
      data: findAddress,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while fetching addresses!",
      error: error.message || error,
    });
  }
};

exports.updateAddress = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { addressId } = req.params;
    const valid = addressValidationSchema.updateAddressValidator.validate(
      req.body,
      {
        abortEarly: true,
      }
    );
    if (valid.error) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: valid.error.message || valid.error,
      });
    }

    const [fetchAddress, fetchAddressError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      query: { _id: addressId, userId: req.user.id },
    });

    if (fetchAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while finding and upadte addresses!",
        error: fetchAddressError.message || fetchAddressError,
      });
    }

    if (!fetchAddress) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: "No address exist with this address id!",
      });
    }

    const [updateAddress, updateAddressError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      id: addressId,
      body: {
        $set: req.body,
      },
      session,
    });

    if (updateAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while finding and upadte addresses!",
        error: updateAddressError.message || updateAddressError,
      });
    }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: "Address updated successfully!",
      data: updateAddress,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while updating addresses!",
      error: error.message || error,
    });
  }
};

exports.deleteAddress = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { addressId } = req.params;
    const [fetchAddress, fetchAddressError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      query: { _id: addressId, userId: req.user.id },
    });

    if (fetchAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while finding and delete addresses!",
        error: fetchAddressError.message || fetchAddressError,
      });
    }

    if (!fetchAddress) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: "No address exist with this address id!",
      });
    }

    const [deleteAddress, deleteAddressError] = await Db.findByIdAndDelete({
      collection: COLLECTION_NAMES.ADDRESSMODEL,
      id: addressId,
      body: {
        $set: req.body,
      },
      session,
    });

    if (deleteAddressError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        url: req.url,
        method: req.method,
        message: "Error while deleting address!",
        error: deleteAddressError.message || deleteAddressError,
      });
    }
    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: "Address deleted successfully!",
      data: deleteAddress,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while deleting addresses!",
      error: error.message || error,
    });
  }
};
