const cartModel = require('../../../../../brain/model/Cart/cart.model');
const Db = require('../../../../../brain/utils/db');
const {
	COLLECTION_NAMES,
	COLLECTIONS,
} = require('../../../../../brain/utils/modelEnums');
const {
	serverErrorResponse,
	successResponse,
	badRequestResponse,
	notFoundResponse,
} = require('../../../../../brain/utils/response');

exports.addToCart = async (req, res) => {
	const session = await Db.mongoose.startSession();
	session.startTransaction();
	try {
		const { productId, quantity } = req.body;

		if (!productId) {
			await session.abortTransaction();
			session.endSession();
			return badRequestResponse({
				res,
				message: 'Add products to add in cart!',
			});
		}

		if (Number.parseInt(quantity) < 1) {
			await session.abortTransaction();
			session.endSession();
			return badRequestResponse({
				res,
				message: 'Quantity should be greater then or equal to 1!',
			});
		}

		let [cart, cartError] = await Db.fetchOne({
			collection: COLLECTION_NAMES.CARTMODEL,
			query: { userId: req.user.id },
		});

		if (cartError) {
			await session.abortTransaction();
			await session.endSession();
			return serverErrorResponse({
				res,
				message: 'Error while adding product to cart!',
				error: cartError.message || cartError,
			});
		}
		if (!cart) {
			cart = new cartModel({
				userId: req.user.id,
				products: [],
			});
		}
		await cart.addProducts(productId, quantity);
		await cart.save({ session });

		await session.commitTransaction();
		session.endSession();

		return successResponse({
			res,
			message: 'Products added successfully to cart!',
		});
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		return serverErrorResponse({
			res,
			message: 'Error while adding product to cart!',
			error: error.message || error,
		});
	}
};

exports.removeFromCart = async (req, res) => {
	const session = await Db.mongoose.startSession();
	session.startTransaction();
	try {
		const { productId } = req.body;

		if (!productId) {
			await session.abortTransaction();
			session.endSession();
			return badRequestResponse({
				res,
				message: 'Specify products to remove from cart!',
			});
		}

		let [cart, cartError] = await Db.fetchOne({
			collection: COLLECTION_NAMES.CARTMODEL,
			query: { userId: req.user.id },
		});
		if (cartError) {
			await session.abortTransaction();
			await session.endSession();
			return serverErrorResponse({
				res,
				message: 'Error while adding product to cart!',
				error: cartError.message || cartError,
			});
		}
		if (!cart) {
			await session.abortTransaction();
			session.endSession();
			return notFoundResponse({
				res,
				message: 'Nothing found in cart!',
			});
		}
		try {
			await cart.removeProduct(productId);
			await cart.save({ session });
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			return badRequestResponse({
				res,
				message: error.message || error,
			});
		}

		await session.commitTransaction();
		session.endSession();

		return successResponse({
			res,
			message: 'Products removed successfully from cart!',
		});
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		return serverErrorResponse({
			res,
			message: 'Error while adding product to cart!',
			error: error.message || error,
		});
	}
};

exports.getCartitems = async (req, res) => {
	try {
		const matchState = [
			{
				$match: {
					userId: Db.mongoose.Types.ObjectId.createFromHexString(req.user.id),
				},
			},
			{
				$unwind: {
					path: '$products',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$lookup: {
					from: COLLECTIONS.PRODUCT_COLLECTION,
					localField: 'products.productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{
				$group: {
					_id: '$userId',
					products: {
						$push: {
							$cond: {
								if: { $gt: [{ $size: '$product' }, 0] }, // Check if product array is not empty
								then: {
									product: { $arrayElemAt: ['$product', 0] },
									quantity: '$products.quantity',
								},
								else: null, // Use null if no product found
							},
						},
					},
					totalPrice: { $first: '$totalPrice' },
				},
			},
			{
				$project: {
					_id: 1,
					userId: '$_id',
					products: {
						$filter: {
							input: '$products',
							as: 'prod',
							cond: { $ne: ['$$prod', null] }, // Filter out null values
						},
					},
					totalPrice: 1,
				},
			},
		];

		const [[cartItems], cartItemsError] = await Db.aggregate({
			collection: COLLECTION_NAMES.CARTMODEL,
			query: matchState,
		});
		if (cartItemsError) {
			return serverErrorResponse({
				res,
				message: 'Error while getting cart items!',
				error: cartItemsError.message || cartItemsError,
			});
		}
		console.log(cartItems);
		if (cartItems === null || cartItems?.products?.length === 0 || !cartItems) {
			return notFoundResponse({
				res,
				message: 'No products found in cart!',
			});
		}

		return successResponse({
			res,
			data: cartItems,
		});
	} catch (error) {
		return serverErrorResponse({
			res,
			message: 'Error while getting cart items!',
			error: error.message || error,
		});
	}
};
