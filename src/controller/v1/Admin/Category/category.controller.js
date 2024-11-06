const multer = require('multer');
const { categoryService } = require('../../../../../brain/helper/Category');
const { checkCreatedby } = require('../../../../../brain/utils/checkCreatedBy');
const {
  deleteFromCloudinary,
  upload,
} = require('../../../../../brain/utils/cloudinary');
const {
  handleImageUpload,
} = require('../../../../../brain/utils/handleImageUpload');
const Db = require('../../../../../brain/utils/db');
const {
  COLLECTION_NAMES,
  COLLECTIONS,
} = require('../../../../../brain/utils/modelEnums');
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  successResponse,
  unauthorizedResponse,
  alreadyExists,
  limitExceeded,
  notFoundResponse,
} = require('../../../../../brain/utils/response');

const { categorySchema } = require('../../../../joi/v1/Category');
const { CATEGORY_IMAGES } = require('../../../../../brain/utils/enums');
const {
  CLOUDINARY_CATEGORY_BUCKET,
} = require('../../../../../brain/utils/config');

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
        console.error('error in multer file upload : ', error);
        if (error === 'File too large' || error.message === 'File too large') {
          return limitExceeded({
            res,
            message:
              'Image size is too large only image upto 10 MB is supported!',
            error: error.message || error,
          });
        }
        return serverErrorResponse({
          res,
          message: error.message || error,
        });
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
          message: 'Required images are missing.',
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
            message: 'Error while searching existing category!',
            error: findCategoryError.message || findCategoryError,
          });
        }

        if (findCategory) {
          await session.abortTransaction();
          await session.endSession();
          return alreadyExists({
            res,
            message: req.body.name + ' : category already exists!',
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
            message: 'Only 1 logo and icon image is allowed!',
          });
        }

        const [
          [categoryIcon, categoryIconerror],
          [categoryImages, categoryLogoerror],
        ] = await Promise.all([
          await handleImageUpload(
            req.files[CATEGORY_IMAGES.CATEGORY_ICON],
            CLOUDINARY_CATEGORY_BUCKET // Folder name in Cloudinary
          ),
          await handleImageUpload(
            req.files[CATEGORY_IMAGES.CATEGORY_LOGO],
            CLOUDINARY_CATEGORY_BUCKET // Folder name in Cloudinary
          ),
        ]);

        if (categoryIconerror || categoryLogoerror) {
          await session.abortTransaction();
          await deleteFromCloudinary(categoryIcon || categoryImages);
          await session.endSession();
          return serverErrorResponse({
            res,
            error: categoryIconerror || categoryLogoerror,
            url: req.url,
            method: req.method,
          });
        }
        const [icon] = categoryIcon || null;
        const [logo] = categoryImages || null;

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
          message: 'Error while uploading images!',
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
      message: 'Error while creating category',
      error: error.message || error,
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';
    const status = req.query.status || 'main';

    const matchStage = {
      name: {
        $regex: `.*${search.replace(/\s+/g, '-').split('').join('.*')}.*`,
        $options: 'i',
      },
      parent: req.body.parentId
        ? new Db.mongoose.Types.ObjectId(req.body.parentId)
        : null,
    };

    const pipeline = [
      {
        $match: {
          ...matchStage,
        },
      },
      {
        $graphLookup: {
          from:
            status === 'deleted'
              ? COLLECTIONS.CATEGORY_BIN_COLLECTION
              : COLLECTIONS.CATEGORY_COLLECTION,
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'hasChilds',
          depthField: 'depth',
          restrictSearchWithMatch: {},
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.USER_COLLECTION,
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $set: {
          subCategoryCount: {
            $size: '$hasChilds',
          },
          hasChilds: {
            $cond: {
              if: { $gt: [{ $size: '$hasChilds' }, 0] },
              then: true,
              else: false,
            },
          },
          createdBy: {
            $reduce: {
              input: '$createdBy',
              initialValue: '',
              in: {
                $concat: [
                  '$$value',
                  { $cond: [{ $eq: ['$$value', ''] }, '', ' '] },
                  { $concat: ['$$this.firstname', ' ', '$$this.lastname'] },
                ],
              },
            },
          },
        },
      },
    ];

    const [categories, categoriesError] = await Db.aggregate({
      collection:
        status === 'deleted'
          ? COLLECTION_NAMES.CATEGORYBINMODEL
          : COLLECTION_NAMES.CATEGORYMODEL,
      query: [...pipeline, { $skip: offset }, { $limit: limit }],
    });

    if (categoriesError) {
      return unprocessableEntityResponse({
        res,
        error: categoriesError,
      });
    }

    const [[mainCount, mainCountError], [deletedCount, deletedCountError]] = [
      await Db.count({
        collection: COLLECTION_NAMES.CATEGORYMODEL,
        query: { ...matchStage },
      }),
      await Db.count({
        collection: COLLECTION_NAMES.CATEGORYMODEL,
        query: { ...matchStage },
      }),
    ];

    if (mainCountError || deletedCountError)
      return serverErrorResponse({
        res,
        error: mainCountError || deletedCountError,
      });

    return successResponse({
      res,
      data: {
        categories,
        ...(status === 'main'
          ? { main: mainCount }
          : { deleted: deletedCount }),
      },
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error fetching categories!',
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
        message: 'You dont have access to update this category!',
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
      message: 'Error while updating category!',
    });
  }
};

exports.deleteCategoryImage = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { uuid } = req.params;
    const type = req.query.type;

    let categoryImages = [];

    const [findCategory, findCategoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: { _id: id },
    });

    if (findCategoryError) {
      await session.abortTransaction();
      await session.endSession();
      return serverErrorResponse({
        res,
        error: findCategoryError.message || findCategoryError,
      });
    }

    if (!findCategory || findCategory === null) {
      await session.abortTransaction();
      await session.endSession();
      return notFoundResponse({
        res,
        message: req.body.name + ': category not exists!',
      });
    }
    if (
      (type === 'logo' && findCategory?.logo?.uuid !== uuid) ||
      (type === 'icon' && findCategory?.icon?.uuid !== uuid)
    ) {
      await session.abortTransaction();
      await session.endSession();
      return notFoundResponse({
        res,
        message: 'Category image not exists!',
      });
    } else {
      const [brand, brandError] = await Db.findByIdAndUpdate({
        collection: COLLECTION_NAMES.CATEGORYMODEL,
        id,
        body: {
          $set: {
            ...(type === 'logo'
              ? { logo: null }
              : type === 'icon' && { icon: null }),
          },
        },
        session,
      });

      if (brandError) {
        await session.abortTransaction();
        await session.endSession();
        return unprocessableEntityResponse({
          res,
          message: brandError,
          error: brandError.message || brandError,
        });
      }
    }
    categoryImages.push(
      type === 'logo'
        ? findCategory?.logo
        : type === 'icon' && findCategory?.icon
    );

    console.log(categoryImages);
    await deleteFromCloudinary(categoryImages);

    await session.commitTransaction();
    await session.endSession();
    return successResponse({
      res,
      message: 'Cateory images deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      message: 'Error while deleting category images',
      error: error.message || error,
    });
  }
};
