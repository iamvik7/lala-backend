const multer = require("multer");
const { productService } = require("../../../../../brain/helper/Product");
const Db = require("../../../../../brain/utils/db");
const { PRODUCT_IMAGES } = require("../../../../../brain/utils/enums");
const {
  COLLECTION_NAMES,
  COLLECTIONS,
} = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  successResponse,
  limitExceeded,
  notFoundResponse,
} = require("../../../../../brain/utils/response");
const { productSchema } = require("../../../../joi/v1/Product");
const {
  deleteFromCloudinary,
  upload,
} = require("../../../../../brain/utils/cloudinary");
const {
  handleImageUpload,
} = require("../../../../../brain/utils/handleImageUpload");
const {
  CLOUDINARY_PRODUCT_BUCKET,
} = require("../../../../../brain/utils/config");
const {
  ImageDeleteHelper,
} = require("../../../../../brain/helper/ImageDeleteHelper/ImageDeleteHelper");
const productBinHelper = require("../../../../../brain/helper/Product/Bin");

exports.addProduct = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const UploadMultiple = upload.fields([
      { name: PRODUCT_IMAGES.IMAGES, maxCount: 10 },
    ]);

    let uploadedImages = [];
    UploadMultiple(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        // return res.json(error)
        console.error("error in multer file upload : ", error);
        if (error === "File too large" || error.message === "File too large") {
          return limitExceeded({
            res,
            message:
              "Image size is too large only image upto 10 MB is supported!",
            error: error.message || error,
          });
        }
        await session.abortTransaction();
        await session.endSession();
        return serverErrorResponse({
          res,
          message: error.message || error,
        });
      }

      if (!req.files || !req.files[PRODUCT_IMAGES.IMAGES]) {
        await session.abortTransaction();
        await session.endSession();
        return badRequestResponse({
          res,
          message: "Required images are missing.",
        });
      }

      if (
        req.files &&
        (req.files[PRODUCT_IMAGES.IMAGES].length > 5 ||
          req.files[PRODUCT_IMAGES.IMAGES].length < 2)
      ) {
        await session.abortTransaction();
        await session.endSession();
        return badRequestResponse({
          res,
          message: "Minimum 2 and maximum 5 images are allowed!",
        });
      }

      try {
        if (req.body.tags) req.body.tags = JSON.parse(req.body.tags);
        const valid = productSchema.productValidator.validate(req.body, {
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

        const [images, imagesError] = await handleImageUpload(
          req.files[PRODUCT_IMAGES.IMAGES],
          CLOUDINARY_PRODUCT_BUCKET
        );

        if (imagesError) {
          await session.abortTransaction();
          await deleteFromCloudinary(images?.flat());
          await session.endSession();
          return serverErrorResponse({
            res,
            error: imagesError.message || imagesError,
            url: req.url,
            method: req.method,
          });
        }

        uploadedImages.push(images);

        const {
          name,
          description,
          price,
          quantity,
          stock,
          weight,
          tags,
          categoryId,
          brandId,
        } = req.body;

        const [fetchBrand, fetchBrandError] = await Db.fetchOne({
          collection: COLLECTION_NAMES.BRANDMODEL,
          query: { _id: brandId },
        });

        if (fetchBrandError) {
          await session.abortTransaction();
          await deleteFromCloudinary(uploadedImages?.flat());
          await session.endSession();
          return serverErrorResponse({
            res,
            error: fetchBrandError.message || fetchBrandError,
          });
        }

        if (!fetchBrand || fetchBrand === null) {
          await session.abortTransaction();
          await deleteFromCloudinary(uploadedImages?.flat());
          await session.endSession();
          return notFoundResponse({
            res,
            message: "Brand not exist",
          });
        }

        const [product, productError] = await productService.createProduct({
          name,
          description,
          price,
          quantity,
          stock,
          weight,
          images,
          tags,
          categoryId,
          brandId,
          userId: req.user.id,
          session,
        });

        if (productError) {
          await session.abortTransaction();
          await session.endSession();
          return unprocessableEntityResponse({
            res,
            error: productError.message || productError,
          });
        }

        await session.commitTransaction();
        await session.endSession();
        return successResponse({
          res,
          data: product,
        });
      } catch (error) {
        await session.abortTransaction();
        await deleteFromCloudinary(uploadedImages?.flat());
        await session.endSession();
        return serverErrorResponse({
          res,
          message: "Error while creating product!",
          error: error.message || error,
        });
      }
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while creating product!",
      error: error.message || error,
    });
  }
};

exports.updateProduct = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const UploadMultiple = upload.fields([
      { name: PRODUCT_IMAGES.IMAGES, maxCount: 10 },
    ]);

    let uploadedImages = [];
    UploadMultiple(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        // return res.json(error)
        console.error("error in multer file upload : ", error);
        if (error === "File too large" || error.message === "File too large") {
          return limitExceeded({
            res,
            message:
              "Image size is too large only image upto 10 MB is supported!",
            error: error.message || error,
          });
        }
        await session.abortTransaction();
        await session.endSession();
        return serverErrorResponse({
          res,
          message: error.message || error,
        });
      }

      if (
        req.files[PRODUCT_IMAGES.IMAGES] &&
        req.files[PRODUCT_IMAGES.IMAGES].length > 5
      ) {
        await session.abortTransaction();
        await session.endSession();
        return badRequestResponse({
          res,
          message: "Maximum 5 images are allowed!",
        });
      }

      const [fetchProduct, fetchProductError] = await Db.fetchOne({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { _id: req.params.productId },
      });

      if (fetchProductError) {
        await session.abortTransaction();
        await session.endSession();
        return serverErrorResponse({
          res,
          error: fetchProductError.message || fetchProductError,
        });
      }

      if (!fetchProduct || fetchProduct === null) {
        await session.abortTransaction();
        await session.endSession();
        return notFoundResponse({
          res,
          message: "Product not exists.",
        });
      }

      try {
        if (req.body.tags) req.body.tags = JSON.parse(req.body.tags);
        const valid = productSchema.productUpdateValidator.validate(req.body, {
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
        let images, imagesError;
        if (req.files[PRODUCT_IMAGES.IMAGES]) {
          [images, imagesError] = await handleImageUpload(
            req.files[PRODUCT_IMAGES.IMAGES],
            CLOUDINARY_PRODUCT_BUCKET
          );

          if (imagesError) {
            await session.abortTransaction();
            images?.flat() && (await deleteFromCloudinary(images?.flat()));
            await session.endSession();
            return serverErrorResponse({
              res,
              error: imagesError.message || imagesError,
              url: req.url,
              method: req.method,
            });
          }

          uploadedImages.push(images);
        }

        const {
          name,
          description,
          price,
          quantity,
          stock,
          weight,
          tags,
          categoryId,
          brandId,
        } = req.body;

        uploadedImages.push(fetchProduct.images);
        if (uploadedImages?.flat().length > 5) {
          await session.abortTransaction();
          images?.flat() && (await deleteFromCloudinary(images?.flat()));
          await session.endSession();
          return badRequestResponse({
            res,
            message: "Maximum 5 images are allowed!",
          });
        }
        const updateData = {
          ...(name && { name: name }),
          ...(description && { description: description }),
          ...(price && { price: price }),
          ...(quantity && { quantity: quantity }),
          ...(stock && { stock: stock }),
          ...(weight && { weight: weight }),
          ...(images && { images: uploadedImages?.flat() }),
          ...(tags && { tags: tags }),
          ...(categoryId && { categoryId: categoryId }),
          ...(brandId && { brandId: brandId }),
        };

        const [updateProduct, updateProductError] =
          await productService.updateProductHelper({
            productId: req.params.productId,
            data: updateData,
            userId: req.user.id,
            session,
          });

        if (updateProductError === "Category not exist!") {
          await session.abortTransaction();
          images?.flat() && (await deleteFromCloudinary(images?.flat()));
          await session.endSession();
          return badRequestResponse({
            res,
            message: updateProductError.message || updateProductError,
          });
        }

        if (updateProductError === "Product already exists!") {
          await session.abortTransaction();
          images?.flat() && (await deleteFromCloudinary(images?.flat()));
          await session.endSession();
          return badRequestResponse({
            res,
            message: updateProductError.message || updateProductError,
          });
        }

        if (updateProductError === "Brand not exist!") {
          await session.abortTransaction();
          images?.flat() && (await deleteFromCloudinary(images?.flat()));
          await session.endSession();
          return badRequestResponse({
            res,
            message: updateProductError.message || updateProductError,
          });
        }

        if (updateProductError) {
          await session.abortTransaction();
          images?.flat() && (await deleteFromCloudinary(images?.flat()));
          await session.endSession();
          return serverErrorResponse({
            res,
            error: updateProductError.message || updateProductError,
          });
        }

        await session.commitTransaction();
        await session.endSession();
        return successResponse({
          res,
          message: "Product updated successfully",
          data: updateProduct,
        });
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        return serverErrorResponse({
          res,
          error: error.message || error,
        });
      }
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while updating product!",
      error: error.message || error,
    });
  }
};

exports.deleteProductImage = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { productId } = req.params;
    const { uuid } = req.params;
    const type = req.query.type || "logo";

    const [deleteImage, deleteImageError] = await ImageDeleteHelper({
      fileId: productId,
      uuid,
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      type,
      product: true,
      session,
    });

    if (deleteImageError === "file not exists!") {
      await session.abortTransaction();
      session.endSession();
      return notFoundResponse({
        res,
        message: "Product not exists",
      });
    }

    if (deleteImageError === "Image not found in the product") {
      await session.abortTransaction();
      session.endSession();
      return notFoundResponse({
        res,
        message: "Product image not exists",
      });
    }

    if (deleteImageError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        message: deleteImageError.message || deleteImageError,
      });
    }
    if (deleteImage) {
      await session.commitTransaction();
      await session.endSession();
      return successResponse({
        res,
        message: "Brand logo deleted successfully",
      });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while deleting brand logo",
      error: error.message || error,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const status = req.query.status || "all";

    const matchStage = {
      name: {
        $regex: `.*${search.replace(/\s+/g, "-").split("").join(".*")}.*`,
        $options: "i",
      },
    };

    const pipeline = [
      {
        $match: {
          ...matchStage,
          ...(status === "active"
            ? { isActive: true }
            : status === "pending"
            ? { isActive: false }
            : {}),
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.BRAND_COLLECTION,
          localField: "brandId",
          foreignField: "_id",
          as: "brand",
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.CATEGORY_COLLECTION,
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.USER_COLLECTION,
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $set: {
          brand: {
            $arrayElemAt: ["$brand.name", 0],
          },
          category: {
            $arrayElemAt: ["$category.name", 0],
          },

          createdAt: {
            $dateToString: {
              format: "%d %b %Y",
              date: "$createdAt",
            },
          },
          updatedAt: {
            $dateToString: {
              format: "%d %b %Y",
              date: "$updatedAt",
            },
          },
          createdBy: {
            $reduce: {
              input: "$createdBy",
              initialValue: "",
              in: {
                $concat: [
                  "$$value",
                  { $cond: [{ $eq: ["$$value", ""] }, "", " "] },
                  { $concat: ["$$this.firstname", " ", "$$this.lastname"] },
                ],
              },
            },
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
          name: 1,
          category: 1,
          sold: 1,
          brand: 1,
          createdAt: 1,
          updatedAt: 1,
          createdBy: 1,
          stock: 1,
          isActive: 1,
        },
      },
    ];

    const [fetchProducts, fetchProductsError] = await Db.aggregate({
      collection:
        status === "deleted"
          ? COLLECTION_NAMES.PRODUCTBINMODEL
          : COLLECTION_NAMES.PRODUCTMODEL,
      query: [...pipeline, { $skip: offset }, { $limit: limit }],
    });

    if (fetchProductsError)
      return serverErrorResponse({
        res,
        error: fetchProductsError.message || fetchProductsError,
      });

    const [
      [activeCount, activeCountError],
      [pendingCount, pendingCountError],
      [allCount, allCountError],
      [deletedCount, deletedCountError],
    ] = [
      await Db.count({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { isActive: true },
      }),
      await Db.count({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { isActive: false },
      }),
      await Db.count({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { ...matchStage },
      }),
      await Db.count({
        collection: COLLECTION_NAMES.PRODUCTBINMODEL,
        query: { ...matchStage },
      }),
    ];

    if (
      activeCountError ||
      pendingCountError ||
      allCountError ||
      deletedCountError
    )
      return serverErrorResponse({
        res,
        error:
          activeCountError ||
          pendingCountError ||
          allCountError ||
          deletedCountError,
      });

    return successResponse({
      res,
      data: {
        products: fetchProducts,
        active: activeCount || 0,
        pending: pendingCount || 0,
        totalCount: allCount || 0,
        deleted: deletedCount || 0,
      },
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      error: error.message || error,
    });
  }
};

exports.getSpecificProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const pipeline = [
      {
        $match: {
          _id: new Db.mongoose.Types.ObjectId(productId),
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.BRAND_COLLECTION,
          localField: "brandId",
          foreignField: "_id",
          as: "selectedBrand",
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.CATEGORY_COLLECTION,
          localField: "categoryId",
          foreignField: "_id",
          as: "selectedCategory",
        },
      },
      {
        $set: {
          selectedBrand: {
            $arrayElemAt: ["$selectedBrand.name", 0],
          },
          selectedCategory: {
            $arrayElemAt: ["$selectedCategory.name", 0],
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
          __v: 0,
          categoryId: 0,
          brandId: 0,
          isActive: 0,
          createdBy: 0,
          createdAt: 0,
          updatedAt: 0,
          sold: 0,
        },
      },
    ];

    const [[product], productError] = await Db.aggregate({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: pipeline,
    });

    if (productError) {
      return serverErrorResponse({
        res,
        message: "Error while fetching product details!",
        error: productError.message || productError,
      });
    }

    if (!product) {
      return badRequestResponse({
        res,
        message: "Product not exists",
      });
    }
    return successResponse({
      res,
      data: { product, instock: product.stock > 5 },
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: "Error while fetching product details!",
      error: error.message || error,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const [deleteProduct, deleteProductError] =
      await productBinHelper.deleteProductHelper(req.params.productId, session);

    if (deleteProductError === "Product not exists!") {
      await session.abortTransaction();
      session.endSession();
      return notFoundResponse({
        res,
        message: "Product not exists!",
      });
    }

    if (deleteProductError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        error: deleteProductError.message || deleteProductError,
      });
    }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: "Product delete successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while deleting product!",
      error: error.message || error,
    });
  }
};

exports.restoreProduct = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const [retoreProduct, retoreProductError] =
      await productBinHelper.restoreProductHelper(
        req.params.productId,
        session
      );

    if (retoreProductError === "Product not exists!") {
      await session.abortTransaction();
      session.endSession();
      return notFoundResponse({
        res,
        message: "Product not exists!",
      });
    }

    if (retoreProductError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        error: retoreProductError.message || retoreProductError,
      });
    }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: "Product restored successfully!",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while restoring product!",
      error: error.message || error,
    });
  }
};
