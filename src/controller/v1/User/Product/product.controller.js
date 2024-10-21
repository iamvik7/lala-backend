const {
	userProductHelper,
} = require('../../../../../brain/helper/User/product');
const {
	serverErrorResponse,
	notFoundResponse,
	successResponse,
	badRequestResponse,
} = require('../../../../../brain/utils/response');

exports.searchProduct = async (req, res) => {
	try {
	} catch (error) {
		return serverErrorResponse({
			res,
			messsage: 'Error while searching product!',
			error: error.message || error,
		});
	}
};

exports.fetchSearchSuggestions = async (req, res) => {
	try {
		const {
			categories = [],
			brands = [],
			search = '',
		} = req.body.filters;

		const [fetchAllProductHome, fetchAllProductHomeError] =
			await userProductHelper.fetchSuggestions(
				categories,
				brands,
				search
			);

		if (
			fetchAllProductHomeError === 'Categories do not exist!'
		)
			return notFoundResponse({
				res,
				message: fetchAllProductHomeError,
			});

		if (fetchAllProductHomeError)
			return serverErrorResponse({
				res,
				error: fetchAllProductHomeError,
			});

		return successResponse({
			res,
			data: fetchAllProductHome,
		});
	} catch (error) {
		return serverErrorResponse({
			res,
			url: req.url,
			method: req.method,
			error: `Error while fetching products: ${error}`,
		});
	}
};

exports.fetchSearchProducts = async (req, res) => {
	try {
		const { offset = 0, limit = 10 } = req.query;
		const {
			categories = [],
			brands = [],
			search = '',
			sort = 'all',
			type,
		} = req.body.filters;

		let fetchAllProductHome, fetchAllProductHomeError;
		if (type === 'product')
			[fetchAllProductHome, fetchAllProductHomeError] =
				await userProductHelper.fetchProducts(
					offset,
					limit,
					categories,
					brands,
					search,
					sort,
					false
				);
		else if (type === 'brand')
			[fetchAllProductHome, fetchAllProductHomeError] =
				await userProductHelper.fetchClients(
					offset,
					limit,
					categories,
					brands,
					search,
					sort,
					false
				);
		else
			return badRequestResponse({
				res,
				message: 'Invalid Search Type',
			});

		if (fetchAllProductHomeError)
			return serverErrorResponse({
				res,
				error: fetchAllProductHomeError,
			});

		return successResponse({
			res,
			data: fetchAllProductHome,
		});
	} catch (error) {
		return serverErrorResponse({
			res,
			url: req.url,
			method: req.method,
			error: `Error while fetching products: ${error}`,
		});
	}
};
