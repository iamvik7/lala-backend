const { categoryDelete } = require("./categoryDelete");
const { categoryRstore, RESTOREERROR } = require("./categoryRestore");

exports.categoryBinService = {
    categoryDelete,
    categoryRstore,
    RESTOREERROR
}