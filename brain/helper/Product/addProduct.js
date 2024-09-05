const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.createProduct = async (req, session) => {
  try {
    const {
      name,
      description,
      price,
      quantity,
      stock,
      weight,
      images,
      tags,
      categoryId,
    } = req.body;

    const [findProduct, findProductError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: { name },
    });
    if (findProductError) {
      retrun[(null, findProductError)];
    }
    if (findProduct) {
      return [null, "Product already exists!"];
    }

    const [findCategory, findCategoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: { _id: categoryId },
    });
    if (findCategoryError) {
      retrun[(null, findCategoryError)];
    }

    if (!findCategory) {
      return [null, "Category not exist!"];
    }
    const [product, productError] = await Db.create({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      body: { ...req.body, createdBy: req.user.id },
      session,
    });

    if (productError) {
      retrun[(null, productError)];
    }
    return [product, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
