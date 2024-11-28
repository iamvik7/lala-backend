const { DB_MODELS } = require('./modelEnums');
const logger = require('./winston');
const mongoose = require('mongoose');

const fetchAll = async ({
  collection,
  query = {},
  projection = null,
  options = {},
}) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.find(query, projection, options);
    return [data, null];
  } catch (err) {
    logger.error(`Error while fetching ${collection} (All): `, err);
    return [null, err.message];
  }
};

const aggregate = async ({ collection, query }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.aggregate(query);
    return [data, null];
  } catch (err) {
    logger.error(`Error while aggregating ${collection}: `, err.message);
    return [null, err.message];
  }
};

const fetchOne = async ({ collection, query, projection = null }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.findOne(query, projection);
    return [data, null];
  } catch (err) {
    logger.error(`Error while fetching ${collection}: `, err.message);
    return [null, err.message];
  }
};

const count = async ({ collection, query }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.countDocuments(query);
    return [data, null];
  } catch (err) {
    logger.error(`Error while fetching count for ${collection}: `, err.message);
    return [null, err.message];
  }
};

const findByIdAndUpdate = async ({ collection, id, body, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.findByIdAndUpdate(id, body, {
      new: true,
      session,
    });
    return [data, null];
  } catch (err) {
    logger.error(`Error while updating ${collection}: `, err.errmsg);
    return [null, err.message || err.errmsg];
  }
};

const findByIdAndDelete = async ({ collection, id, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.findByIdAndDelete(id, { session });
    return [data, null];
  } catch (err) {
    logger.error(`Error while deleting ${collection}: `, err.message);
    return [null, err.message];
  }
};

const deleteMany = async ({ collection, query, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.deleteMany(query, { session });
    return [data, null];
  } catch (err) {
    logger.error(`Error while deleting many ${collection}: `, err.message);
    return [null, err.message];
  }
};

const create = async ({ collection, body, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = new modelName(body);
    return [await data.save({ session }), null];
  } catch (err) {
    const errorMessage =
      err.errorResponse && err.errorResponse.errmsg && err.message;
    if (errorMessage?.includes('name_1 dup key')) {
      return [null, 'Name already exists'];
    }
    logger.error(`Error while creating ${collection}: `, err);
    return [
      null,
      errorMessage || err.message || 'An unexpected error occurred',
    ];
  }
};

const insertMany = async ({ collection, body, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.insertMany(body, { session });
    return [data, null];
  } catch (err) {
    logger.error(`Error while creating ${collection}: `, err.message);
    return [null, err.message];
  }
};

const updateMany = async ({ collection, query, body, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.updateMany(query, body, { session });
    return [data, null];
  } catch (err) {
    logger.error(`Error while updating many ${collection}: `, err.message);
    return [null, err.message || err.errmsg];
  }
};

const findAndInsert = async ({ collection, query, body, session }) => {
  try {
    const modelName = DB_MODELS[collection];
    const data = await modelName.updateOne(
      query,
      { $set: body },
      { upsert: true, session }
    );
    return [data, null];
  } catch (err) {
    logger.error(`Error while updating many ${collection}: `, err.message);
    return [null, err.message];
  }
};

const bulkWrite = async ({ collection, operations }) => {
  try {
    const modelName = DB_MODELS[collection];
    const result = await modelName.bulkWrite(operations);
    return [result, null];
  } catch (err) {
    logger.error(
      `Error while performing bulk write in ${collection}: `,
      err.message
    );
    return [null, err.message || err.errmsg];
  }
};

const Db = {
  mongoose,
  fetchAll,
  aggregate,
  fetchOne,
  create,
  findByIdAndUpdate,
  findByIdAndDelete,
  count,
  insertMany,
  updateMany,
  deleteMany,
  findAndInsert,
  bulkWrite,
};

module.exports = Db;
