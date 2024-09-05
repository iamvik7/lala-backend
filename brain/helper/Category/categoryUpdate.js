const Db = require("../../utils/db");
const { COLLECTION_NAMES } = require("../../utils/modelEnums");

exports.updateCategory = async (req, session) => {
  try {
    const { name, logo } = req.body;
    const { categoryId } = req.params;

    const [category, categoryError] = await Db.findByIdAndUpdate({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      id: categoryId,
    });

    if (categoryError) 
      return [null, categoryError.message || categoryError];
    

    if (!category) 
      return [null, "Category not exist!"];
    

    category.name = name ? name : category.name;
    category.logo = logo ? logo : category.logo;

    category.save(session);
    return [category, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
