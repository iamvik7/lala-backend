const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.createProduct = async ({
  name,
  description,
  price,
  quantity,
  stock,
  weight,
  images,
  tags,
  categoryId,
  brand,
  userId,
  session,
}) => {
  try {
    const [findProduct, findProductError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: { name },
    });
    if (findProductError) {
      return [null, findProductError];
    }
    if (findProduct) {
      return [null, "Product already exists!"];
    }

    const [findCategory, findCategoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: { _id: categoryId },
    });
    if (findCategoryError) {
      return [null, findCategoryError];
    }

    if (!findCategory) {
      return [null, "Category not exist!"];
    }
    const [product, productError] = await Db.create({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      body: {
        name,
        description,
        price,
        quantity,
        stock,
        weight,
        images,
        tags,
        categoryId,
        brand,
        createdBy: userId,
      },
      session,
    });

    if (productError) {
      return [null, productError];
    }
    return [product, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
