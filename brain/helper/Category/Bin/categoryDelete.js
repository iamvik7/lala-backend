const Db = require('../../../utils/db');
const { COLLECTION_NAMES, COLLECTIONS } = require('../../../utils/modelEnums');
const ObjectId = require('mongoose').Types.ObjectId;

exports.categoryDelete = async (categoryId, session) => {
	try {
		// Fetch the category to be deleted
		const [category, categoryError] = await Db.fetchOne({
			collection: COLLECTION_NAMES.CATEGORYMODEL,
			query: { _id: categoryId },
		});

		if (categoryError) {
			return [null, categoryError.message || categoryError];
		}

		if (!category) {
			return [null, 'Category not found!'];
		}

		// Fetch all subcategories and products related to the category
		const [subcategoriesAndProducts, subcategoriesAndProductsError] =
			await Db.aggregate({
				collection: COLLECTION_NAMES.CATEGORYMODEL,
				query: [
					{
						$match: { _id: new ObjectId(categoryId) },
					},
					{
						$graphLookup: {
							from: COLLECTIONS.CATEGORY_COLLECTION,
							startWith: '$_id',
							connectFromField: '_id',
							connectToField: 'parent',
							as: 'subcategories',
						},
					},
					{
						$lookup: {
							from: COLLECTIONS.PRODUCT_COLLECTION,
							localField: 'subcategories._id',
							foreignField: 'categoryId',
							as: 'products',
						},
					},
				],
			});

		if (subcategoriesAndProductsError) {
			return [
				null,
				subcategoriesAndProductsError.message || subcategoriesAndProductsError,
			];
		}

		// Insert the category, subcategories, and products into the bin collections
		const [binCategories, binCategoriesError] = await Db.insertMany({
			collection: COLLECTION_NAMES.CATEGORYBINMODEL,
			body: [
				category,
				...subcategoriesAndProducts.flatMap((item) => item.subcategories),
			],
			session,
		});

		if (binCategoriesError) {
			return [null, binCategoriesError.message || binCategoriesError];
		}

		const [binProducts, binProductsError] = await Db.insertMany({
			collection: COLLECTION_NAMES.PRODUCTBINMODEL,
			body: subcategoriesAndProducts.flatMap((item) => item.products),
			session,
		});

		if (binProductsError) {
			return [null, binProductsError.message || binProductsError];
		}

		// update the product isActive to false
		const [updatedProducts, updatedProductsError] = await Db.updateMany({
			collection: COLLECTION_NAMES.PRODUCTBINMODEL,
			query: {
				_id: {
					$in: subcategoriesAndProducts.flatMap((item) =>
						item.products.map((product) => product._id)
					),
				},
			},
			body: {
				$set: {
					isActive: false,
				},
			},
			session,
		});

		if (updatedProductsError) {
			return [null, updatedProductsError.message || updatedProductsError];
		}
		// Delete the category, subcategories, and products from the main collections
		const categoryToDelete = [
			category,
			...subcategoriesAndProducts.flatMap((item) => item.subcategories),
		];
		const [deletedCategories, deletedCategoriesError] = await Db.deleteMany({
			collection: COLLECTION_NAMES.CATEGORYMODEL,
			query: { _id: { $in: categoryToDelete.map((item) => item._id) } },
			session,
		});

		if (deletedCategoriesError) {
			return [null, deletedCategoriesError.message || deletedCategoriesError];
		}

		const [deletedProducts, deletedProductsError] = await Db.deleteMany({
			collection: COLLECTION_NAMES.PRODUCTMODEL,
			query: {
				_id: {
					$in: subcategoriesAndProducts.flatMap((item) =>
						item.products.map((product) => product._id)
					),
				},
			},
			session,
		});

		if (deletedProductsError) {
			return [null, deletedProductsError.message || deletedProductsError];
		}

		return [`Category and subcategories deleted successfully!`, null];
	} catch (error) {
		return [null, error.message || error];
	}
};
