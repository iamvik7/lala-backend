const { productService } = require("../../../../../brain/helper/Product");
const Db = require("../../../../../brain/utils/db");
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
