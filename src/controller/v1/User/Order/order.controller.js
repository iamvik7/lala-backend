const Db = require('../../../../../brain/utils/db');
const { COLLECTION_NAMES } = require('../../../../../brain/utils/modelEnums');
const {
	serverErrorResponse,
	badRequestResponse,
	successResponse,
	outOfStockError,
} = require('../../../../../brain/utils/response');

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
