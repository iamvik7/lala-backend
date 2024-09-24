const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.categoryAdd = async (name, parent, logo, icon, userId, session) => {
  try {

    const [category, categoryError] = await Db.create({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      body: {
        name,
        logo,
        icon,
        parent,
        createdBy: userId,
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
