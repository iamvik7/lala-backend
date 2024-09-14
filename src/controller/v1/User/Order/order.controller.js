const Db = require("../../../../../brain/utils/db");
const { COLLECTION_NAMES } = require("../../../../../brain/utils/modelEnums");
const {
  serverErrorResponse,
  badRequestResponse,
  successResponse,
} = require("../../../../../brain/utils/response");

exports.createOrderFromCart = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { products, addressId } = req.body;

    if (!products || products.length === 0 || !addressId) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: "Products and addressId is required!",
      });
    }

    const [createOrder, createOrderError] = await Db.create({
      collection: COLLECTION_NAMES,
      body: {
        products,
        userId: req.user.id,
        addressId,
      },
      session,
    });

    // if (createOrderError) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return serverErrorResponse({
    //     res,
    //     url: req.url,
    //     method: req.method,
    //     message: "Error while placing order",
    //     error: createOrderError.message || createOrderError,
    //   });
    // }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: "Order placed successfully!",
      data: createOrder,
    });
  } catch (error) {
    if (
      error.message.startsWith(
        "The following products are out of stock:"
      )
    ) {
      const outOfStockProductIds = error.message
        .split(": ")[1]
        .split(", ")
        .map((id) => id.trim());

      // Fetch the out-of-stock products for the response
      const [outOfStockProducts, outOfStockProductsError] = await Db.fetchAll({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { _id: { $in: outOfStockProductIds } },
      });

      if (outOfStockProductsError) {
        await session.abortTransaction();
        session.endSession();
        return serverErrorResponse({
          res,
          url: req.url,
          method: req.method,
          message: "Error while finding out of stock products",
          error: outOfStockProductsError.message || outOfStockProductsError,
        });
      }
      // Filter out the out-of-stock products from the order
      const updatedProducts = req.body.products.filter(
        (product) =>
          !outOfStockProductIds.includes(product.productId.toString())
      );

      await session.abortTransaction();
      session.endSession();
      return successResponse({
        res,
        message: "Some products are out of stock!",
        data: [...outOfStockProducts, ...updatedProducts],
      });
    }
  }
};
