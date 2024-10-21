const Db = require('../../../utils/db');
const fuzzysort = require('fuzzysort');
const { COLLECTION_NAMES, COLLECTIONS } = require('../../../utils/modelEnums');
const { categoryService } = require('../../Category');

exports.fetchSuggestions = async (categories, brands, search) => {
	try {
		let categoryObjectIds = [];

		// Apply category filter
		if (categories.length > 0) {
			const [categoryExists, errForCategories] = await Db.fetchAll({
				collection: COLLECTION_NAMES.CATEGORYMODEL,

				query: { name: { $in: categories } },
			});

			if (errForCategories) return [null, errForCategories];
			if (!categoryExists || categoryExists.length === 0)
				return [null, 'Categories do not exist!'];

			const nestedFolderIdsPromises = categoryExists.map((cat) =>
				categoryService.getNestedChildIds(cat._id)
			);
			const [nestedFolderIdsResults, nestedFolderIdsResultsError] =
				await Promise.all(nestedFolderIdsPromises);
			const nestedFolderIds = nestedFolderIdsResults
				.flat()
				.filter((id) => id !== null);
			categoryObjectIds = nestedFolderIds.map(
				(id) => new Db.mongoose.Types.ObjectId(id)
			);
		}

		// Apply sector filter
		const matchQuery = {};
		if (categoryObjectIds.length > 0) {
			matchQuery.folderId = { $in: categoryObjectIds };
		}
		if (brands.length > 0) {
			matchQuery.tags = { $in: brands };
		}

		// Function to fetch suggestions
		const fetchSuggestions = async (query) => {
			const [productSuggestions, errForProductSuggestions] = await Db.aggregate(
				{
					collection: COLLECTION_NAMES.PRODUCTMODEL,
					query: [
						{ $match: query },
						{
							$lookup: {
								from: COLLECTIONS.CATEGORY_COLLECTION,
								localField: 'categoryId',
								foreignField: '_id',
								as: 'category',
							},
						},
						{
							$lookup: {
								from: COLLECTIONS.BRAND_COLLECTION,
								localField: 'brandId',
								foreignField: '_id',
								as: 'brands',
							},
						},
						{
							$addFields: {
								productCategory: { $arrayElemAt: ['$category.name', 0] },
								brandName: { $arrayElemAt: ['$brands.name', 0] },
							},
						},
						{
							$project: {
								_id: 1,
								name: 1,
								productCategory: 1,
								brandName: 1,
							},
						},
					],
				}
			);

			if (errForProductSuggestions) return [null, errForProductSuggestions];

			return [productSuggestions, null];
		};

		let uniqueSuggestions = [];

		if (search.trim()) {
			// Apply fuzzy search if search is not empty
			const [allSuggestions, error] = await fetchSuggestions(matchQuery);
			if (error) return [null, error];

			if (allSuggestions.length > 0) {
				const fuzzyResults = fuzzysort.go(search, allSuggestions, {
					keys: ['name', 'productCategory'],
					threshold: -10000, // Lower threshold means stricter match
				});

				// Extract and deduplicate suggestions
				uniqueSuggestions = [
					...new Set(fuzzyResults.map((result) => result.obj.name)),
				].slice(0, 10);
			}
		}

		// Fetch default suggestions if search is empty or no results found
		if (search.trim() === '' || uniqueSuggestions.length === 0) {
			const [defaultSuggestions, errForDefaultSuggestions] = await Db.aggregate(
				{
					collection: COLLECTION_NAMES.PRODUCTMODEL,
					query: [
						{ $match: { isActive: true } },
						{
							$lookup: {
								from: COLLECTIONS.CATEGORY_COLLECTION,
								localField: 'categoryId',
								foreignField: '_id',
								as: 'category',
							},
						},
						{
							$lookup: {
								from: COLLECTIONS.BRAND_COLLECTION,
								localField: 'brandId',
								foreignField: '_id',
								as: 'brands',
							},
						},
						{
							$addFields: {
								productCategory: { $arrayElemAt: ['$category.name', 0] },
								brandName: { $arrayElemAt: ['$brands.name', 0] },
							},
						},
						{
							$project: {
								_id: 1,
								name: 1,
								brandName: 1,
							},
						},
						{ $limit: 10 }, // Limit to top 10 default suggestions
					],
				}
			);

			if (errForDefaultSuggestions) return [null, errForDefaultSuggestions];

			uniqueSuggestions = defaultSuggestions.map(
				(suggestion) => suggestion.name
			);
		}

		return [uniqueSuggestions, null];
	} catch (error) {
		console.log(error.message);
		return [null, error.message];
	}
};
