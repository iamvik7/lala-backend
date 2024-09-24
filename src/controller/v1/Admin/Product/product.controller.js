const { productService } = require("../../../../../brain/helper/Product");
const Db = require("../../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  unprocessableEntityResponse,
  successResponse,
} = require("../../../../../brain/utils/response");
const { productSchema } = require("../../../../joi/v1/Product");

exports.addProduct = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
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

    const [product, productError] = await productService.createProduct(
      req,
      session
    );

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
    await session.endSession();
    return serverErrorResponse({
      res,
      message: "Error while creating product!",
      error: error.message || error,
    });
  }
};

exports.getSpecificProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(productId);
    const [product, productError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: { _id: productId },
      // projection: {__v: 0, createdBy:}
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
        message: "Product not found with this id!",
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
