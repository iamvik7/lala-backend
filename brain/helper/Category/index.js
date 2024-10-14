const { categoryAdd } = require("./categoryAdd");
const { updateCategory } = require("./categoryUpdate");
const { getNestedChildIds } = require("./getNestedChildIds");

exports.categoryService = {
    categoryAdd,
    updateCategory,
    getNestedChildIds
}