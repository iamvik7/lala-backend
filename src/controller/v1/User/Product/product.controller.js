const {
	userProductHelper,
} = require('../../../../../brain/helper/User/product');
const {
	serverErrorResponse,
	notFoundResponse,
	successResponse,
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
		const { categories = [], sectors = [], search = '' } = req.body.filters;

		const [fetchAllProductHome, fetchAllProductHomeError] =
			await userProductHelper.fetchSuggestions(categories, sectors, search);

		if (fetchAllProductHomeError === 'Categories do not exist!')
			return notFoundResponse({ res, message: fetchAllProductHomeError });

		if (fetchAllProductHomeError)
			return serverErrorResponse({ res, error: fetchAllProductHomeError });

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
