const Db = require('../../../../../brain/utils/db');
const {
  COLLECTION_NAMES,
  COLLECTIONS,
} = require('../../../../../brain/utils/modelEnums');
const orderId = require('../../../../../brain/utils/orderIdGenrator');
const {
  serverErrorResponse,
  badRequestResponse,
  successResponse,
  outOfStockError,
  notFoundResponse,
} = require('../../../../../brain/utils/response');
const formatDateToIST = require('../../../../../brain/utils/formatDateToIST');
const { ORDER_STATUS } = require('../../../../../brain/utils/enums');
const orderModel = require('../../../../../brain/model/Order/order.model');
const ObjectId = require('mongoose').Types.ObjectId;

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
        message: 'Products and addressId are required!',
      });
    }

    const [createOrder, createOrderError] = await Db.create({
      collection: COLLECTION_NAMES.ORDERMODEL,
      body: {
        products,
        orderId: orderId(),
        userId: req.user.id,
        addressId,
      },
      session,
    });

    if (
      createOrderError?.startsWith('The following products are out of stock:')
    ) {
      const outOfStockProductIds = createOrderError
        .split(': ')[1]
        .split(', ')
        .map((id) => id.trim());

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
          message: 'Error while finding out-of-stock products',
          error: outOfStockProductsError.message || outOfStockProductsError,
        });
      }

      const updatedProducts = req.body.products.filter(
        (product) =>
          !outOfStockProductIds.includes(product.productId.toString())
      );

      const [inStockProducts, inStockProductsError] = await Db.fetchAll({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: {
          _id: { $in: updatedProducts.map((product) => product.productId) },
        },
      });

      if (inStockProductsError) {
        await session.abortTransaction();
        session.endSession();
        return serverErrorResponse({
          res,
          url: req.url,
          method: req.method,
          message: 'Error while finding in-stock products',
          error: inStockProductsError.message || inStockProductsError,
        });
      }

      await session.abortTransaction();
      session.endSession();
      return outOfStockError({
        res,
        message: 'Some products are out of stock!',
        data: { outOfStock: outOfStockProducts, inStock: inStockProducts },
      });
    }

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: 'Order placed successfully!',
      data: createOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      message: 'Error while placing order',
      error: error.message || error,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  const session = await Db.mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;

    const [fetchOrder, fetchOrderError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.ORDERMODEL,
      query: { _id: orderId },
      projection: { _id: 1, status: 1 },
    });

    if (fetchOrderError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        error: fetchOrderError.message || fetchOrderError,
      });
    }
    if (fetchOrder.status === ORDER_STATUS.CANCELLED) {
      await session.abortTransaction();
      session.endSession();
      return badRequestResponse({
        res,
        message: 'Order already cancelled',
      });
    }
    if (!fetchOrder) {
      await session.abortTransaction();
      session.endSession();
      return notFoundResponse({
        res,
        message: 'Order not found',
      });
    }

    const [cancelOrder, cancelOrderError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.ORDERMODEL,
      id: fetchOrder._id,
      body: {
        $set: {
          status: ORDER_STATUS.CANCELLED,
          isDelivered: false,
        },
      },
      session,
    });

    if (cancelOrderError) {
      await session.abortTransaction();
      session.endSession();
      return serverErrorResponse({
        res,
        error: cancelOrderError.message || cancelOrderError,
      });
    }

    const orderToUpdate = await orderModel
      .findById(fetchOrder._id)
      .session(session);

    await orderToUpdate.updateProductFields(orderToUpdate, session);

    await session.commitTransaction();
    session.endSession();
    return successResponse({
      res,
      message: 'Order cancelled successfully',
      data: cancelOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return serverErrorResponse({
      res,
      error: error.message,
      method: req.method,
    });
  }
};

exports.getSpecificOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const pipeline = [
      {
        $match: {
          _id: new ObjectId(orderId),
          userId: new ObjectId(req.user.id),
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.ADDRESS_COLLECTION,
          localField: 'addressId',
          foreignField: '_id',
          as: 'deliverTo',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.PRODUCT_COLLECTION,
          let: { id: '$products.productId', quantity: '$products.quantity' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$id'],
                },
              },
            },
            {
              $set: {
                images: {
                  $arrayElemAt: ['$images', 0],
                },
              },
            },
            {
              $addFields: {
                orderedQuantity: {
                  $concat: [
                    { $toString: '$weight' },
                    ' x ',
                    { $toString: '$$quantity' },
                  ],
                },
              },
            },
            {
              $project: {
                name: 1,
                images: 1,
                orderedQuantity: 1,
                price: {
                  $multiply: ['$price', '$$quantity'],
                },
              },
            },
          ],
          as: 'orderedProducts',
        },
      },
      {
        $unwind: {
          path: '$orderedProducts',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $set: {
          address: {
            phone: { $arrayElemAt: ['$deliverTo.phone', 0] },
            recipent: { $arrayElemAt: ['$deliverTo.recipent', 0] },
            deliverTo: {
              $reduce: {
                input: '$deliverTo',
                initialValue: '',
                in: {
                  $concat: [
                    '$$value',
                    { $cond: [{ $eq: ['$$value', ''] }, '', ' '] },
                    {
                      $concat: [
                        '$$this.house',
                        ', ',
                        '$$this.street',
                        ', ',
                        '$$this.landmark',
                        ' - ',
                        { $toString: '$$this.zipcode' },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          status: {
            $first: '$status',
          },
          totalPrice: {
            $first: '$totalPrice',
          },
          address: {
            $first: '$address',
          },
          createdAt: {
            $first: '$createdAt',
          },
          updatedAt: {
            $first: '$updatedAt',
          },
          orderId: {
            $first: '$orderId',
          },
          orderedProducts: {
            $push: '$orderedProducts',
          },
        },
      },
    ];

    const [[fetchOrder], fetchOrderError] = await Db.aggregate({
      collection: COLLECTION_NAMES.ORDERMODEL,
      query: pipeline,
    });

    if (fetchOrderError)
      return serverErrorResponse({
        res,
        error: error.message || error,
      });

    if (!fetchOrder || fetchOrder === null)
      return notFoundResponse({
        res,
        message: 'Order not found',
      });

    fetchOrder.createdAt = formatDateToIST(fetchOrder.createdAt);
    fetchOrder.updatedAt = formatDateToIST(fetchOrder.updatedAt);
    return successResponse({
      res,
      data: fetchOrder,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error while fetching order summary',
      error: error.message || error,
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const pipeline = [
      {
        $match: {
          userId: new ObjectId(req.user.id),
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.PRODUCT_COLLECTION,
          localField: 'products.productId',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $set: {
          orderProductImages: {
            $map: {
              input: '$products',
              as: 'product',
              in: {
                $arrayElemAt: ['$$product.images', 0],
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
          status: 1,
          orderId: 1,
          isDelivered: 1,
          createdAt: 1,
          updatedAt: 1,
          totalPrice: 1,
          orderProductImages: 1,
        },
      },
    ];

    let [fetchOrders, fetchOrdersError] = await Db.aggregate({
      collection: COLLECTION_NAMES.ORDERMODEL,
      query: [...pipeline, { $skip: offset }, { $limit: limit }],
    });

    if (fetchOrdersError)
      return serverErrorResponse({
        res,
        error: fetchOrdersError.message || fetchOrdersError,
      });

    if (fetchOrders.length) {
      fetchOrders = fetchOrders.map((order) => {
        return {
          ...order,
          createdAt: formatDateToIST(order.createdAt),
          updatedAt: formatDateToIST(order.updatedAt),
        };
      });
    }
    return successResponse({
      res,
      data: fetchOrders,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      message: 'Error while fetching your orders',
      error: error.message || error,
    });
  }
};
