const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          default: 1,
          min: 0,
        },
      },
      {
        _id: false
      }
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// cartSchema.methods.addProductsArray = async function (productsToAdd) {
//   const Product = mongoose.model("Product");

//   for (const item of productsToAdd) {
//     const productId = item.productId;
//     const quantityToAdd = item.quantity || 1; // Default to 1 if quantity is not provided

//     const existingProductIndex = this.products.findIndex(
//       (p) => p.productId.toString() === productId.toString()
//     );
//     if (item.quantity < 1) {
//       throw new Error("Quantity of product should not be less then 1!");
//     }
//     if (existingProductIndex !== -1) {
//       // If product exists, add the quantity
//       if (!item.quantity) {
//         this.products[existingProductIndex].quantity += quantityToAdd;
//       } else {
//         this.products[existingProductIndex].quantity = quantityToAdd;
//       }
//     } else {
//       // If product doesn't exist, add it with the specified quantity
//       const product = await Product.findById(productId);
//       if (product) {
//         this.products.push({ productId: product._id, quantity: quantityToAdd });
//       }
//     }
//   }

//   await this.calculateTotalPrice();
// };

cartSchema.methods.addProducts = async function (productId, quantity) {
  const Product = mongoose.model("Product");
  const quantityToAdd = quantity || 1;
  const existingProductIndex = this.products.findIndex(
    (p) => p.productId.toString() === productId.toString()
  );
  if (quantityToAdd < 1) {
    throw new Error("Quantity of product should not be less then 1!");
  }

  if (existingProductIndex !== -1) {
    // Update existing product quantity
    if (!quantity) {
      this.products[existingProductIndex].quantity += quantityToAdd;
    } else {
      this.products[existingProductIndex].quantity = quantityToAdd;
    }
  } else if (quantityToAdd > 0) {
    // Add new product only if quantity is positive
    const product = await Product.findById(productId);
    if (product) {
      this.products.push({ productId: product._id, quantity });
    } else {
      throw new Error("Product not found!");
    }
  }

  await this.calculateTotalPrice();
};

cartSchema.methods.removeProduct = async function (productId) {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const initialLength = this.products.length;
  this.products = this.products.filter(
    (product) => product.productId.toString() !== productId.toString()
  );

  if (this.products.length === initialLength) {
    throw new Error("Product not found in the cart");
  }

  await this.calculateTotalPrice();
};

cartSchema.methods.calculateTotalPrice = async function () {
  const Product = mongoose.model("Product");
  let totalPrice = 0;

  for (const item of this.products) {
    const product = await Product.findById(item.productId);
    if (product) {
      totalPrice += product.price * item.quantity;
    }
  }

  this.totalPrice = totalPrice;
};

module.exports = mongoose.model("Cart", cartSchema);
