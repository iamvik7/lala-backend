const multer = require("multer");
const { categoryService } = require("../../../../../brain/helper/Category");
const { checkCreatedby } = require("../../../../../brain/utils/checkCreatedBy");
const {
  deleteFromCloudinary,
  upload,
} = require("../../../../../brain/utils/cloudinary");
const {
  handleImageUpload,
} = require("../../../../../brain/utils/handleImageUpload");
const Db = require("../../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  successResponse,
  unauthorizedResponse,
  alreadyExists,
} = require("../../../../../brain/utils/response");

const { categorySchema } = require("../../../../joi/v1/Category");
const { CATEGORY_IMAGES } = require("../../../../../brain/utils/enums");
const {
  CLOUDINARY_CATEGORY_BUCKET,
} = require("../../../../../brain/utils/config");

exports.addCategory = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const UploadMultiple = upload.fields([
      { name: CATEGORY_IMAGES.CATEGORY_LOGO, maxCount: 10 },
      { name: CATEGORY_IMAGES.CATEGORY_ICON, maxCount: 10 },
    ]);

    UploadMultiple(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        // return res.json(error)
        console.error("error in multer file upload : ", error);
      }
      if (
        !req.files ||
        !req.files[CATEGORY_IMAGES.CATEGORY_LOGO] ||
        !req.files[CATEGORY_IMAGES.CATEGORY_ICON]
      ) {
        await session.abortTransaction();
        await session.endSession();
        return badRequestResponse({
          res,
          message: "Required images are missing.",
        });
      }

      try {
        const valid = categorySchema.categoryValidator.validate(
          { name: req.body.name, parent: req.body.parent },
          {
            abortEarly: false,
          }
        );
        if (valid.error) {
          await session.abortTransaction();
          await session.endSession();
          return badRequestResponse({
            res,
            error: valid.error.message,
          });
        }

        const [findCategory, findCategoryError] = await Db.fetchOne({
          collection: COLLECTION_NAMES.CATEGORYMODEL,
          query: { name: req.body.name },
        });

        if (findCategoryError) {
          await session.abortTransaction();
          await session.endSession();
          return serverErrorResponse({
            res,
            message: "Error while searching existing category!",
            error: findCategoryError.message || findCategoryError,
          });
        }

        if (findCategory) {
          await session.abortTransaction();
          await session.endSession();
          return alreadyExists({
            res,
            message: req.body.name + " : category already exists!",
          });
        }
        if (
          req.files[CATEGORY_IMAGES.CATEGORY_ICON].length > 1 ||
          req.files[CATEGORY_IMAGES.CATEGORY_LOGO].length > 1
        ) {
          await session.abortTransaction();
          session.endSession();
          return badRequestResponse({
            res,
            message: "Only 1 logo and icon image is allowed!",
          });
        }

        const [
          [categoryIcon, categoryIconerror],
          [categoryLogo, categoryLogoerror],
        ] = await Promise.all([
          await handleImageUpload(
            req.files[CATEGORY_IMAGES.CATEGORY_ICON],
            CLOUDINARY_CATEGORY_BUCKET // Folder name in Cloudinary
          ),
          await handleImageUpload(
            req.files[CATEGORY_IMAGES.CATEGORY_LOGO],
            CLOUDINARY_CATEGORY_BUCKET // Folder name in Cloudinary
          )
        ]);

        if (categoryIconerror || categoryLogoerror) {
          await session.abortTransaction();
          await deleteFromCloudinary(categoryIcon || categoryLogo);
          await session.endSession();
          return serverErrorResponse({
            res,
            error: categoryIconerror || categoryLogoerror,
            url: req.url,
            method: req.method,
          });
        }
        const [icon] = categoryIcon || null;
        const [logo] = categoryLogo || null;

        // return res.json({logo, icon});
        const [category, categoryError] = await categoryService.categoryAdd(
          req.body.name,
          req.body.parent,
          logo,
          icon,
          req.user.id,
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
        session.endSession();

        return serverErrorResponse({
          res,
          message: "Error while uploading images!",
          error: error.message || error,
        });
      }
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
