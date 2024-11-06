const Db = require('../../utils/db');
const { COLLECTION_NAMES } = require('../../utils/modelEnums');

exports.updateProductHelper = async ({ productId, data, userId, session }) => {
  try {
    if (data?.name) {
      const [findProduct, findProductError] = await Db.fetchOne({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: { name: data.name },
      });
      if (findProductError) {
        return [null, findProductError];
      }
      if (findProduct) {
        return [null, 'Product already exists!'];
      }
    }

    if (data?.categoryId) {
      const [findCategory, findCategoryError] = await Db.fetchOne({
        collection: COLLECTION_NAMES.CATEGORYMODEL,
        query: { _id: data.categoryId },
      });
      if (findCategoryError) {
        return [null, findCategoryError];
      }
      if (!findCategory) {
        return [null, 'Category not exist!'];
      }
    }

    if (data?.brandId) {
      const [findBrand, findBrandError] = await Db.fetchOne({
        collection: COLLECTION_NAMES.BRANDMODEL,
        query: { _id: data.brandId },
      });
      if (findBrandError) {
        return [null, findBrandError];
      }
      if (!findBrand) {
        return [null, 'Brand not exist!'];
      }
    }

    const [updateProduct, updateProductError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      id: productId,
      body: {
        $set: {
          ...data,
          updatedBy: userId,
        },
      },
      session,
    });

    if (updateProductError) {
      return [null, updateProductError];
    }
    return [updateProduct, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
