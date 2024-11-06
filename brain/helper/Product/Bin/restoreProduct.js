const Db = require('../../../utils/db');
const { COLLECTION_NAMES } = require('../../../utils/modelEnums');

exports.restoreProductHelper = async (productId, session) => {
  try {
    const [fetchProduct, fetchProductError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.PRODUCTBINMODEL,
      query: { _id: productId },
    });

    if (fetchProductError)
      return [null, fetchProductError.message || fetchProductError];

    if (!fetchProduct) return [null, 'Product does not exists in bin!'];

    const [addToStash, addToStashError] = await Db.insertMany({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      body: [fetchProduct],
      session,
    });

    if (addToStashError)
      return [null, addToStashError.error || addToStashError];

    const [remove, removeError] = await Db.findByIdAndDelete({
      collection: COLLECTION_NAMES.PRODUCTBINMODEL,
      id: productId,
      session,
    });

    if (removeError) return [null, removeError.error || removeError];

    return [remove, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
