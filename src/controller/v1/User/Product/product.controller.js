const { serverErrorResponse } = require("../../../../../brain/utils/response");

exports.searchProduct = async (req, res) => {
  try {
    
  } catch (error) {
    return serverErrorResponse({
      res,
      messsage: "Error while searching product!",
      error: error.message || error,
    });
  }
};
