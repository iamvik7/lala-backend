const { mongoose } = require('mongoose');
const { ORDER_STATUS } = require('../../utils/enums');
const { required } = require('joi');

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        quantity: {
          type: Number,
          required: true,
        },
        _id: false,
      },
    ],
    userId: mongoose.Schema.Types.ObjectId,
    addressId: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.CONFIRMED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
      ],
      default: ORDER_STATUS.PROCESSING,
    },
    totalPrice: {
      type: Number,
    },
    orderId: {
      type: String,
      required: true,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre('save', async function (next) {
  const order = this;

  if (order.isModified('status') && order.status === ORDER_STATUS.DELIVERED) {
    order.isDelivered = true; // Set isDelivered to true if status is DELIVERED
  }
  if (order.isNew || order.isModified('products')) {
    const session = await mongoose.startSession(); // Start a session
    session.startTransaction(); // Start a transaction

    try {
      // console.log("Calculating total price...");
      await this.calculateTotalPrice(session); // Pass the session
      await this.updateProductFields(order, session); // Pass the session
      await session.commitTransaction(); // Commit the transaction
      next();
    } catch (error) {
      console.error('Error during transaction:', error); // Log the error
      await session.abortTransaction(); // Abort the transaction on error
      next(error);
    } finally {
      session.endSession(); // End the session
    }
  } else {
    next();
  }
});

orderSchema.methods.calculateTotalPrice = async function (session) {
  const Product = mongoose.model('Product');
  let totalPrice = 0;

  for (const orderProduct of this.products) {
    const product = await Product.findById(orderProduct.productId).session(
      session
    ); // Use the session
    if (product) {
      totalPrice += product.price * orderProduct.quantity; // Assuming 'price' is a field in the Product schema
    }
  }

  this.totalPrice = totalPrice; // Set the calculated total price
};

orderSchema.methods.updateProductFields = async function (order, session) {
  const Product = mongoose.model('Product');
  const outOfStockProducts = [];

  for (const orderProduct of order.products) {
    const product = await Product.findById(orderProduct.productId).session(
      session
    ); // Use the session
    if (product) {
      if (order.status === ORDER_STATUS.CANCELLED) {
        // If the order is cancelled, revert the stock
        product.sold -= orderProduct.quantity;
        product.stock += orderProduct.quantity;
      } else {
        // Check if the product is in stock
        if (product.stock >= orderProduct.quantity) {
          product.sold += orderProduct.quantity;
          product.stock -= orderProduct.quantity;
        } else {
          outOfStockProducts.push(orderProduct.productId); // Collect out-of-stock product IDs
        }
      }

      // Save the updated product with the session
      const savedProduct = await product.save({ session });
    }
  }

  // If there are out-of-stock products, throw an error and do not save the order
  if (outOfStockProducts.length > 0) {
    throw new Error(
      `The following products are out of stock: ${outOfStockProducts.join(', ')}`
    );
  }
};

module.exports = mongoose.model('Order', orderSchema);
