const Db = require('../../../utils/db');
const { COLLECTION_NAMES } = require('../../../utils/modelEnums');

exports.deleteProductHelper = async (productId, session) => {
  try {
    const [fetchProduct, fetchProductError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: { _id: productId },
    });

    if (fetchProductError)
      return [null, fetchProductError.message || fetchProductError];

    if (!fetchProduct) return [null, 'Product not exists!'];

    fetchProduct.isActive = false;

    const [addToStash, addToStashError] = await Db.insertMany({
      collection: COLLECTION_NAMES.PRODUCTBINMODEL,
      body: [fetchProduct],
      session,
    });

    if (addToStashError)
      return [null, addToStashError.error || addToStashError];

    const [remove, removeError] = await Db.findByIdAndDelete({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      id: productId,
      session,
    });

    if (removeError) return [null, removeError.error || removeError];

    return [remove, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
