const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.updateCategory = async (params, body, session) => {
  try {
    const { name, logo } = body;
    const { categoryId } = params;

    const [category, categoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: { _id: categoryId },
    });

    if (categoryError) return [null, categoryError.message || categoryError];

    if (!category) return [null, "Category not exist!"];

    const [updatedCategory, updatedCategoryError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      id: categoryId,
      body: {
        $set: {
          ...(name && {name: name}),
          ...(logo && {logo: logo}),
        },
      },
      session
    });
    if (updatedCategoryError)
      return [null, updatedCategoryError.message || updatedCategoryError];

    return [updatedCategory, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
