const { fetchProducts } = require('./fetchProducts');
const { fetchSuggestions } = require('./fetchSuggestions');

exports.userProductHelper = {
	fetchSuggestions,
	fetchProducts,
};
