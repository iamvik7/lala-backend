const { categoryService } = require("../../../../../brain/helper/Category");
const { checkCreatedby } = require("../../../../../brain/utils/checkCreatedBy");
const Db = require("../../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  successResponse,
  unauthorizedResponse,
} = require("../../../../../brain/utils/response");
const { categorySchema } = require("../../../../joi/v1/Category");

exports.addCategory = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const valid = categorySchema.categoryValidator.validate(req.body, {
      abortEarly: false,
    });
    if (valid.error) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        error: valid.error.message,
      });
    }

    const [category, categoryError] = await categoryService.categoryAdd(
      req,
      session
    );
    if (categoryError) {
      await session.abortTransaction();
      await session.endSession();
      return unprocessableEntityResponse({
        res,
        message: categoryError,
        error: categoryError.message || categoryError,
      });
    }

    await session.commitTransaction();
    await session.endSession();
    return successResponse({
      res,
      data: category,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: "Error while creating category",
      error: error.message || error,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    if (Number.isNaN(+limit) || Number.isNaN(+offset)) {
      return badRequestResponse({
        res,
        message: "Invalid limt and offset value!",
      });
    }
    const { categoryId } = req.body;
    const [categories, categoriesError] = await Db.fetchAll({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: {
        ...(categoryId !== null ? { parent: categoryId } : { parent: null }),
      },
      projection: { __v: 0, createdAt: 0, updatedAt: 0, createdBy: 0 },
      options: { limit: limit || 10, skip: offset || 0 },
    });
    if (categoriesError) {
      return unprocessableEntityResponse({
        res,
        error: categoriesError,
      });
    }
    return successResponse({
      res,
      data: categories,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: "Error fetching categories!",
      error: error.message || error,
    });
  }
};

exports.updateCategory = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const valid = categorySchema.updateCategoryValidator.validate(req.body, {
      abortEarly: false,
    });

    if (valid.error) {
      await session.abortTransaction();
      await session.endSession();
      return badRequestResponse({
        res,
        error: valid.error.message,
      });
    }

    const [check, checkError] = await checkCreatedby(
      req,
      COLLECTION_NAMES.CATEGORYMODEL
    );

    if (checkError) {
      await session.abortTransaction();
      await session.endSession();
      return unprocessableEntityResponse({
        res,
        error: checkError,
      });
    }
    if (check === false) {
      await session.abortTransaction();
      await session.endSession();
      return unauthorizedResponse({
        res,
        message: "You dont have access to update this category!",
      });
    }
    const [category, categoryError] = await categoryService.updateCategory(
      req.params,
      req.body,
      session
    );

    if (categoryError) {
      await session.abortTransaction();
      await session.endSession();
      return unprocessableEntityResponse({
        res,
        error: categoryError,
      });
    }

    await session.commitTransaction();
    await session.endSession();
    return successResponse({
      res,
      data: category,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while updating category!",
    });
  }
};
