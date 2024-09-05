const Db = require("./db");
const { USER_ROLES } = require("./enums");   
exports.checkCreatedby = async (req, collection) => {
  try {
    let id;
    if (req.params.id) {
      id = req.params.id;
    } else if (req.params.categoryId) {
      id = req.params.categoryId;
    }
    
    const [checkCreated, checkCreatedError] = await Db.fetchOne({
      collection,
      query: {
        _id: id,
        createdBy: req.user.id,
      },
    });

    if (checkCreatedError) {
      return [null, checkCreatedError];
    }
    if (checkCreated === null && req.user.role !== USER_ROLES.SUPERADMIN) {
      return [false, null];
    }
    return [true, null];
  } catch (error) {
    return [null, error.message];
  }
};
