const Db = require("../../../utils/db");
const { COLLECTION_NAMES, COLLECTIONS } = require("../../../utils/modelEnums");
const ObjectId = require("mongoose").Types.ObjectId;



const ISSUBCATEGORYERROR = "ISSUBCATEGORY"

exports.categoryRstore = async (req, session) => {
  try {
    // Fetch the category to be deleted
    const [category, categoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYBINMODEL,
      query: { _id: req.params.categoryId },
    });

    if (categoryError) {
      return [null, categoryError.message || categoryError];
    }

    if (!category) {
      return [null, "Category not found!"];
    }

    if (category.parent) {
      const [[findParent], findParentError] = await Db.aggregate({
        collection: COLLECTION_NAMES.CATEGORYBINMODEL,
        query: [
          {
            $match: {
              _id: new ObjectId(req.params.categoryId),
            },
          },
          {
            $graphLookup: {
              from: COLLECTIONS.CATEGORY_BIN_COLLECTION,
              startWith: "$_id",
              connectFromField: "parent",
              connectToField: "_id",
              as: "subcategories",
              depthField: "depth",
            },
          },
          {
            $unwind: {
              path: "$subcategories",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $set: {
              "subcategories.depth": {
                $toInt: "$subcategories.depth",
              },
            },
          },
          {
            $sort: {
              "subcategories.depth": -1,
            },
          },
          {
            $group: {
              _id: "$_id",
              name: {$first: "$name"},
              subcategories: {
                $push: "$subcategories",
              },
            },
          },
          {
            $addFields: {
              parentId: {
                $toString: {
                  $arrayElemAt: ["$subcategories._id", 0],
                },
              },
              grandParent: {
                $arrayElemAt: ["$subcategories.name", 0],
              },
            },
          },
          {
            $project: {
              _id: 0,
              subcategories: 0,
            },
          },
        ],
      });

      if (findParentError) {
        return [null, findParentError.message || findParentError];
      }
      
      return [findParent, ISSUBCATEGORYERROR];
    }

    // Fetch all subcategories and products related to the category
    const [subcategoriesAndProducts, subcategoriesAndProductsError] =
      await Db.aggregate({
        collection: COLLECTION_NAMES.CATEGORYBINMODEL,
        query: [
          {
            $match: { _id: new ObjectId(req.params.categoryId) },
          },
          {
            $graphLookup: {
              from: COLLECTIONS.CATEGORY_BIN_COLLECTION,
              startWith: "$_id",
              connectFromField: "_id",
              connectToField: "parent",
              as: "subcategories",
            },
          },
          {
            $lookup: {
              from: COLLECTIONS.PRODUCT_BIN_COLLECTION,
              localField: "subcategories._id",
              foreignField: "categoryId",
              as: "products",
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

    // update the product isActive to false

    // Insert the category, subcategories, and products into the bin collections
    const [binCategories, binCategoriesError] = await Db.insertMany({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
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
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      body: subcategoriesAndProducts.flatMap((item) => item.products),
      session,
    });

    if (binProductsError) {
      return [null, binProductsError.message || binProductsError];
    }

    // Delete the category, subcategories, and products from the main collections
    const categoryToDelete = [
      category,
      ...subcategoriesAndProducts.flatMap((item) => item.subcategories),
    ];
    const [deletedCategories, deletedCategoriesError] = await Db.deleteMany({
      collection: COLLECTION_NAMES.CATEGORYBINMODEL,
      query: { _id: { $in: categoryToDelete.map((item) => item._id) } },
      session,
    });

    if (deletedCategoriesError) {
      return [null, deletedCategoriesError.message || deletedCategoriesError];
    }

    const [deletedProducts, deletedProductsError] = await Db.deleteMany({
      collection: COLLECTION_NAMES.PRODUCTBINMODEL,
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

    return [`Category and subcategories restored successfully!`, null];
  } catch (error) {
    return [null, error.message || error];
  }
};


exports.RESTOREERROR = {
    ISSUBCATEGORYERROR
}