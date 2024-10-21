const Db = require("../../utils/db");
const { COLLECTIONS, COLLECTION_NAMES } = require("../../utils/modelEnums");
const ObjectId = require("mongoose").Types.ObjectId;

exports.getNestedChildIds = async (categoryId) => {
  try {
    const pipeline = [
      {
        $match: {
          _id: new ObjectId(categoryId),
        },
      },
      {
        $graphLookup: {
          from: COLLECTIONS.CATEGORY_COLLECTION,
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "childs",
          depthField: "depth",
          restrictSearchWithMatch: {},
        },
      },
      {
        $set: {
          childs: {
            $map: {
              input: "$childs",
              as: "child",
              in: "$$child._id",
            },
          },
        },
      },
      {
        $set: {
          childs: {
            $concatArrays: [["$_id"], "$childs"],
          },
        },
      },
      {
        $project: {
          _id: 0,
          childs: 1,
        },
      },
    ];

    const [[ids], idsError] = await Db.aggregate({
      collection: COLLECTION_NAMES.CATEGORYMODEL,
      query: pipeline,
    });

    if (idsError) return [null, idsError.message || idsError];

    return [ids.childs, null];
  } catch (error) {
    return [null, error.message || error];
  }
};
