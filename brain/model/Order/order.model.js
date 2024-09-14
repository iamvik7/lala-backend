const { mongoose } = require("mongoose");
const { ORDER_STATUS } = require("../../utils/enums");

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        productId: mongoose.Schema.Types.ObjectId, // Fixed typo from 'produtcId' to 'productId'
        quantity: {
          type: Number,
          required: true,
        },
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
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function (next) {
  const order = this;

  if (order.isNew || order.isModified("products")) {
    try {
      await this.calculateTotalPrice();
      await this.updateProductFields(order);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

orderSchema.methods.calculateTotalPrice = async function () {
  const Product = mongoose.model("Product");
  let totalPrice = 0;

  for (const orderProduct of this.products) {
    const product = await Product.findById(orderProduct.productId);
    if (product) {
      totalPrice += product.price * orderProduct.quantity; // Assuming 'price' is a field in the Product schema
    }
  }

  this.totalPrice = totalPrice; // Set the calculated total price
};

orderSchema.methods.updateProductFields = async function (order, session) {
  const Product = mongoose.model("Product");
  const outOfStockProducts = [];

  for (const orderProduct of order.products) {
    const product = await Product.findById(orderProduct.productId);
    if (product) {
      if (order.status !== ORDER_STATUS.CANCELLED) {
        // Check if the product is in stock
        if (product.stock >= orderProduct.quantity) {
          product.sold += orderProduct.quantity;
          product.stock -= orderProduct.quantity;
        } else {
          outOfStockProducts.push(orderProduct.productId); // Collect out-of-stock product IDs
        }
      } else {
        // If the order is cancelled, revert the stock
        product.sold -= orderProduct.quantity;
        product.stock += orderProduct.quantity;
      }
    }
  }

  // If there are out-of-stock products, throw an error and do not save the order
  if (outOfStockProducts.length > 0) {
    throw new Error(`The following products are out of stock: ${outOfStockProducts.join(", ")}`);
  }

  // Save product changes only if all products are in stock
  for (const orderProduct of order.products) {
    const product = await Product.findById(orderProduct.productId);
    if (product) {
      await product.save({ session });
    }
  }
};

module.exports = mongoose.model("Order", orderSchema);