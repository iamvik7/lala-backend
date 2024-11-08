const multer = require('multer');
const Db = require('../../../../../brain/utils/db');
const { BRAND_IMAGES } = require('../../../../../brain/utils/enums');
const {
  serverErrorResponse,
  limitExceeded,
  badRequestResponse,
  successResponse,
  unprocessableEntityResponse,
  alreadyExists,
  notFoundResponse,
} = require('../../../../../brain/utils/response');
const {
  upload,
  deleteFromCloudinary,
} = require('../../../../../brain/utils/cloudinary');
const {
  COLLECTION_NAMES,
  COLLECTIONS,
} = require('../../../../../brain/utils/modelEnums');
const {
  handleImageUpload,
} = require('../../../../../brain/utils/handleImageUpload');
const {
  CLOUDINARY_BRAND_BUCKET,
} = require('../../../../../brain/utils/config');
const { updatedBy } = require('../../../../../brain/model/Brand/brand.design');

exports.addBrand = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const UploadMultiple = upload.fields([
      { name: BRAND_IMAGES.BRAND_LOGO, maxCount: 10 },
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
      if (!req.files || !req.files[BRAND_IMAGES.BRAND_LOGO]) {
        await session.abortTransaction();
        await session.endSession();
        return badRequestResponse({
          res,
          message: 'Required images are missing.',
        });
      }

      try {
        if (!req.body.name) {
          await session.abortTransaction();
          await session.endSession();
          return badRequestResponse({
            res,
            message: 'Brand name is required',
          });
        }

        const [findBrand, findBrandError] = await Db.fetchOne({
          collection: COLLECTION_NAMES.BRANDMODEL,
          query: { name: req.body.name },
        });

        if (findBrandError) {
          await session.abortTransaction();
          await session.endSession();
          return serverErrorResponse({
            res,
            error: findBrandError.message || findBrandError,
          });
        }

        if (findBrand) {
          await session.abortTransaction();
          await session.endSession();
          return alreadyExists({
            res,
            message: req.body.name + ': brand already exists!',
          });
        }
        if (req.files[BRAND_IMAGES.BRAND_LOGO].length > 1) {
          await session.abortTransaction();
          session.endSession();
          return badRequestResponse({
            res,
            message: 'Only 1 logo image is allowed!',
          });
        }

        const [brandLogo, brandLogoerror] = await handleImageUpload(
          req.files[BRAND_IMAGES.BRAND_LOGO],
          CLOUDINARY_BRAND_BUCKET // Folder name in Cloudinary
        );

        if (brandLogoerror) {
          await session.abortTransaction();
          await deleteFromCloudinary(brandLogo);
          await session.endSession();
          return serverErrorResponse({
            res,
            error: brandLogoerror,
            url: req.url,
            method: req.method,
          });
        }
        const [logo] = brandLogo || null;

        // return res.json({logo});
        const [brand, brandError] = await Db.create({
          collection: COLLECTION_NAMES.BRANDMODEL,
          body: {
            name: req.body.name,
            logo: logo,
            createdBy: req.user.id,
            updatedBy: null,
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

        await session.commitTransaction();
        await session.endSession();
        return successResponse({
          res,
          data: brand,
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
    session.endSession();
    return serverErrorResponse({
      res,
      message: 'Error while adding brand',
      error: error.message || error,
    });
  }
};

exports.updateBrand = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const UploadMultiple = upload.fields([
      { name: BRAND_IMAGES.BRAND_LOGO, maxCount: 10 },
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

      try {
        const { id } = req.params;
        const [findBrand, findBrandError] = await Db.fetchOne({
          collection: COLLECTION_NAMES.BRANDMODEL,
          query: { _id: id },
        });

        if (findBrandError) {
          await session.abortTransaction();
          await session.endSession();
          return serverErrorResponse({
            res,
            error: findBrandError.message || findBrandError,
          });
        }

        if (!findBrand || findBrand === null) {
          await session.abortTransaction();
          await session.endSession();
          return notFoundResponse({
            res,
            message: req.body.name + ': brand not exists!',
          });
        }
        if (
          req.files[BRAND_IMAGES.BRAND_LOGO] &&
          req.files[BRAND_IMAGES.BRAND_LOGO]?.length > 1
        ) {
          await session.abortTransaction();
          session.endSession();
          return badRequestResponse({
            res,
            message: 'Only 1 logo image is allowed!',
          });
        }
        let logo = null;
        if (
          req.files[BRAND_IMAGES.BRAND_LOGO] ||
          req.files[BRAND_IMAGES.BRAND_LOGO]
        ) {
          const [[brandLogo], brandLogoerror] = await handleImageUpload(
            req.files[BRAND_IMAGES.BRAND_LOGO],
            CLOUDINARY_BRAND_BUCKET // Folder name in Cloudinary
          );

          if (brandLogoerror) {
            await session.abortTransaction();
            await deleteFromCloudinary(brandLogo);
            await session.endSession();
            return serverErrorResponse({
              res,
              error: brandLogoerror,
              url: req.url,
              method: req.method,
            });
          }
          logo = brandLogo;
        }

        // return res.json({logo});
        const [brand, brandError] = await Db.findByIdAndUpdate({
          collection: COLLECTION_NAMES.BRANDMODEL,
          id,
          body: {
            $set: {
              ...(req.body.name && { name: req.body.name }),
              ...(logo && { logo }),
              ...(logo || (req.body.name && { updatedBy: req.user.id })),
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

        await session.commitTransaction();
        await session.endSession();
        return successResponse({
          res,
          data: brand,
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
    session.endSession();
    return serverErrorResponse({
      res,
      message: 'Error while updating brand',
      error: error.message || error,
    });
  }
};

exports.deleteBrandImage = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { uuid } = req.params;
    let brandLogo = [];

    const [findBrand, findBrandError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: { _id: id },
    });

    if (findBrandError) {
      await session.abortTransaction();
      await session.endSession();
      return serverErrorResponse({
        res,
        error: findBrandError.message || findBrandError,
      });
    }

    if (!findBrand || findBrand === null) {
      await session.abortTransaction();
      await session.endSession();
      return notFoundResponse({
        res,
        message: req.body.name + ': brand not exists!',
      });
    }
    if (findBrand?.logo?.uuid !== uuid) {
      await session.abortTransaction();
      await session.endSession();
      return notFoundResponse({
        res,
        message: 'brand logo not exists!',
      });
    } else {
      const [brand, brandError] = await Db.findByIdAndUpdate({
        collection: COLLECTION_NAMES.BRANDMODEL,
        id,
        body: {
          $set: {
            logo: null,
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
    brandLogo.push(findBrand?.logo);
    await deleteFromCloudinary(brandLogo);

    await session.commitTransaction();
    await session.endSession();
    return successResponse({
      res,
      message: 'Brand logo deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      message: 'Error while deleting brand logo',
      error: error.message || error,
    });
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    const matchStage = {
      name: {
        $regex: `.*${search.replace(/\s+/g, '-').split('').join('.*')}.*`,
        $options: 'i',
      },
    };

    const pipeline = [
      {
        $match: {
          ...matchStage,
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.PRODUCT_COLLECTION,
          localField: '_id',
          foreignField: 'brandId',
          as: 'products',
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
        $lookup: {
          from: COLLECTIONS.USER_COLLECTION,
          localField: 'updatedBy',
          foreignField: '_id',
          as: 'updatedBy',
        },
      },
      {
        $addFields: {
          liveProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.isActive', true] },
              },
            },
          },
          pendingProducts: {
            $size: {
              $filter: {
                input: '$products',
                as: 'product',
                cond: { $eq: ['$$product.isActive', false] },
              },
            },
          },
        },
      },
      {
        $set: {
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
          updatedBy: {
            $reduce: {
              input: '$updatedBy',
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
          createdAt: {
            $dateToString: { format: '%d %b %Y', date: '$createdAt' },
          },
          updatedAt: {
            $dateToString: { format: '%d %b %Y', date: '$updatedAt' },
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          products: 0,
          __v: 0,
          logo: 0,
        },
      },
    ];

    const [brands, brandsError] = await Db.aggregate({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: [...pipeline, { $skip: offset }, { $limit: limit }],
    });

    if (brandsError) {
      return serverErrorResponse({
        res,
        error: brandsError.message || brandsError,
      });
    }

    const [brandCount, brandCountError] = await Db.count({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: { ...matchStage },
    });

    if (brandCountError) {
      return serverErrorResponse({
        res,
        error: brandCountError.message || brandCountError,
      });
    }

    return successResponse({
      res,
      data: {
        brands,
        totalCount: brandCount || 0,
      },
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error while fetching brands',
      error: error.message || error,
    });
  }
};

exports.getSpeicificBrand = async (req, res) => {
  try {
    const { brandId } = req.params;

    let [findBrand, findBrandError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: { _id: brandId },
      projection: {
        __v: 0,
        updatedAt: 0,
        createdAt: 0,
        updatedBy: 0,
        createdBy: 0,
      },
    });

    if (findBrandError)
      return serverErrorResponse({
        res,
        error: findBrandError.message || findBrandError,
      });

    if (!findBrand)
      return notFoundResponse({
        res,
        message: 'Brand not exists',
      });

    return successResponse({
      res,
      data: findBrand,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error while fetching brand details',
      error: error.message || error,
    });
  }
};

exports.brandDropdown = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    const matchStage = {
      name: {
        $regex: `.*${search.replace(/\s+/g, '-').split('').join('.*')}.*`,
        $options: 'i',
      },
    };

    const [brands, brandsError] = await Db.fetchAll({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: { ...matchStage },
      options: { sort: { createdAt: -1 }, skip: offset, limit: limit },
      projection: { name: 1 },
    });

    if (brandsError) {
      return serverErrorResponse({
        res,
        error: brandsError.message || brandsError,
      });
    }

    const [brandCount, brandCountError] = await Db.count({
      collection: COLLECTION_NAMES.BRANDMODEL,
      query: { ...matchStage },
    });

    if (brandCountError) {
      return serverErrorResponse({
        res,
        error: brandCountError.message || brandCountError,
      });
    }

    return successResponse({
      res,
      data: {
        brands,
        totalCount: brandCount || 0,
      },
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error while getting brands for dropdown',
      error: error.message || error,
    });
  }
};
