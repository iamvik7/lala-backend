const fuzzysort = require('fuzzysort');
const Db = require('../../../utils/db');
const {
	COLLECTION_NAMES,
	COLLECTIONS,
} = require('../../../utils/modelEnums');
const { categoryService } = require('../../Category');

exports.fetchProducts = async (
	offset = 0,
	limit = 10,
	categories = [],
	brands = [],
	search = '',
	sortOption = 'newest',
	isForSuggestions = false
) => {
	try {
		const parsedLimit = parseInt(limit, 10);
		const parsedOffset = parseInt(offset, 10);
		let categoryObjectIds = [];
		let categoryRoutes = [];
		let brandIds = [];

		if (!Array.isArray(categories)) {
			console.error('Invalid categories input:', categories);
			categories = [];
		}
		if (!Array.isArray(brands)) {
			console.error('Invalid brands input:', brands);
			brands = [];
		}

		if (categories.length > 0) {
			const [categoryExists, errForCategories] =
				await Db.fetchAll({
					collection: COLLECTION_NAMES.CATEGORYMODEL,
					query: { name: { $in: categories } },
				});

			if (errForCategories) return [null, errForCategories];
			if (!categoryExists || categoryExists.length === 0)
				return [null, 'Categories do not exist!'];

			const nestedcategoryIdsPromises = categoryExists.map(
				(cat) => categoryService.getNestedChildIds(cat._id)
			);
			const [
				nestedcategoryIdsResults,
				nestedcategoryIdsResultsError,
			] = await Promise.all(nestedcategoryIdsPromises);
			const nestedcategoryIds = nestedcategoryIdsResults
				.flat()
				.filter((id) => id !== null);
			categoryObjectIds = nestedcategoryIds.map(
				(id) => new Db.mongoose.Types.ObjectId(id)
			);

			if (categoryExists.length === 1) {
				let fetchRouteQuery = [
					{
						$match: {
							_id: new Db.mongoose.Types.ObjectId(
								categoryExists[0]._id
							),
						},
					},
					{
						$graphLookup: {
							from: COLLECTIONS.CATEGORY_COLLECTION,
							startWith: '$parent',
							connectFromField: 'parent',
							connectToField: '_id',
							as: 'parentCategories',
							depthField: 'depth',
						},
					},
					{
						$addFields: {
							route: {
								$cond: {
									if: { $gt: [{ $size: '$parentCategories' }, 0] },
									then: {
										$concatArrays: [
											{
												$map: {
													input: { $reverseArray: '$parentCategories' },
													as: 'parentCat',
													in: {
														id: '$$parentCat._id',
														name: '$$parentCat.name',
													},
												},
											},
											[{ id: '$_id', name: '$name' }],
										],
									},
									else: [{ id: '$_id', name: '$name' }],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
							route: 1,
						},
					},
				];

				let [fetchCategoryRoutes, errFetchingCategoryRoutes] =
					await Db.aggregate({
						collection: COLLECTION_NAMES.CATEGORYMODEL,
						query: fetchRouteQuery,
					});
				categoryRoutes = fetchCategoryRoutes[0]?.route;
			}
		}

		const matchQuery = { isActive: true };
		if (categoryObjectIds.length > 0) {
			matchQuery.categoryId = { $in: categoryObjectIds };
		}

		const searchTokens = search.trim().split(/\s+/);

		if (searchTokens.length > 0) {
			const clientSearchQuery = {
				name: {
					$regex: new RegExp(searchTokens.join('|'), 'i'),
				},
			};
			const [matchingClients, errForMatchingClients] =
				await Db.fetchAll({
					collection: COLLECTION_NAMES.BRANDMODEL,
					query: clientSearchQuery,
					projection: { _id: 1 },
				});

			if (errForMatchingClients)
				return [null, errForMatchingClients];
			if (matchingClients.length > 0) {
				brandIds = matchingClients.map((brand) => brand._id);
			}

			console.log('Brand IDs found:', brandIds);

			const orConditions = searchTokens.map((token) => ({
				$or: [
					{ name: { $regex: new RegExp(token, 'i') } },
					{
						productCategory: { $regex: new RegExp(token, 'i') },
					},
					...(Array.isArray(brandIds) && brandIds.length > 0
						? [{ brandId: { $in: brandIds } }]
						: []),
				],
			}));

			matchQuery.$and = orConditions;
		}
		let sortCriteria = {};
		switch (sortOption) {
			case 'newest':
				sortCriteria = { createdAt: -1 };
				break;
			// case 'popular':
			// 	sortCriteria = { views: -1 };
			// 	break;
			default:
				sortCriteria = { _id: 1 };
				break;
		}

		if (isForSuggestions && search.trim()) {
			const [allSuggestions, error] =
				await fetchSuggestions(matchQuery);
			if (error) return [null, error];

			const fuzzyResults = fuzzysort.go(
				search,
				allSuggestions,
				{
					keys: ['name', 'productCategory'],
					threshold: -10000,
				}
			);

			const uniqueSuggestions = [
				...new Set(
					fuzzyResults.map(
						(result) => result.obj.name || result.obj.name
					)
				),
			].slice(0, 10);
			return [uniqueSuggestions, null];
		}

		const collection = COLLECTION_NAMES.PRODUCTMODEL;
		const [countResults, errForCount] = await Db.aggregate({
			collection,
			query: [{ $match: matchQuery }, { $count: 'total' }],
		});

		if (errForCount) return [null, errForCount];
		const totalCount = countResults.length
			? countResults[0].total
			: 0;

		let combinedResults = [];
		let remainingLimit = parsedLimit;
		let currentOffset = parsedOffset;

		let query;

		if (remainingLimit > 0 && currentOffset < totalCount) {
			query = [
				{ $match: matchQuery },
				{ $skip: currentOffset },
				{ $limit: remainingLimit },
				{ $sort: sortCriteria },
				{
					$lookup: {
						from: COLLECTIONS.CATEGORY_COLLECTION,
						localField: 'categoryId',
						foreignField: '_id',
						as: 'category',
					},
				},
				{
					$project: {
						_id: 1,
						name: 1,
						productDescription: 1,
						productCategory: 1,
						endPoint: 1,
						category: { $arrayElemAt: ['$category', 0] },
					},
				},
			];

			const [results, errForResults] = await Db.aggregate({
				collection,
				query: query,
			});

			if (errForResults) return [null, errForResults];
			combinedResults = [...combinedResults, ...results];
		}

		return [
			{
				results: combinedResults,
				totalCount,
				categoryRoutes,
			},
			null,
		];
	} catch (error) {
		console.error('Error in fetchAllData:', error.message); // Added error logging
		return [null, error.message];
	}
};

const fetchSuggestions = async (matchQuery) => {
	const collection = COLLECTION_NAMES.PRODUCTMODEL;
	const [suggestions, errForSuggestions] =
		await Db.aggregate({
			collection,
			query: [
				{ $match: matchQuery },
				{
					$project: {
						_id: 1,
						name: 1,
						description: 1,
						productCategory: 1,
						brandId: 1,
					},
				},
			],
		});

	if (errForSuggestions) return [null, errForSuggestions];

	return [suggestions, null];
};
