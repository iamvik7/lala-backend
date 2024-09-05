const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.categoryAdd = async (req, session) => {
  try {
    const { name, logo, parent } = req.body;
    const [findCategory, findCategoryError] = await Db.fetchOne({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: { name },
    });

    if (findCategoryError) {
      return [null, findCategoryError.message || findCategoryError];
    }

    if (findCategory) {
      return [null, "Category already exist!"];
    }

    const [category, categoryError] = await Db.create({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      body: {
        name,
        logo,
        parent,
        createdBy: req.user.id,
      },
      session,
    });

    if (categoryError) {
      return [null, categoryError.message || categoryError];
    }

    return [category, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
