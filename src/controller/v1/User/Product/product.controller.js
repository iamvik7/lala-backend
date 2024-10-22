const {
  userProductHelper,
} = require('../../../../../brain/helper/User/product');
const Db = require('../../../../../brain/utils/db');
const { COLLECTION_NAMES } = require('../../../../../brain/utils/modelEnums');
const {
  serverErrorResponse,
  notFoundResponse,
  successResponse,
  badRequestResponse,
} = require('../../../../../brain/utils/response');

const natural = require('natural');
const MIN_KEYWORD_LENGTH = 2;

exports.extractSearchKeyword = async (req, res) => {
  try {
    const collections = [
      COLLECTION_NAMES.PRODUCTMODEL,
      COLLECTION_NAMES.CATEGORYMODEL,
      COLLECTION_NAMES.BRANDMODEL,
    ];
    const tokenizer = new natural.WordTokenizer();
    const keywordsSet = new Set();

    for (const collection of collections) {
      const [documents, err] = await Db.fetchAll({
        collection,
        query: {},
        projection: { name: 1, tags: 1 },
      });

      if (err) {
        throw new Error(`Error fetching documents from ${collection}: ${err}`);
      }

      documents.forEach((doc) => {
        const tagsString = Array.isArray(doc.tags) ? doc.tags.join(' ') : '';

        const nameKeywords = tokenizer.tokenize(`${doc.name} ${tagsString}`);

        nameKeywords.forEach((keyword) => {
          const lowerCaseKeyword = keyword.toLowerCase();
          const singularKeyword = natural.PorterStemmer.stem(lowerCaseKeyword);

          if (singularKeyword.length >= MIN_KEYWORD_LENGTH) {
            keywordsSet.add(singularKeyword);
          }
        });
      });
    }

    console.log(keywordsSet);
    const bulkOperations = Array.from(keywordsSet).map((keyword) => ({
      updateOne: {
        filter: { keyword },
        update: { keyword },
        upsert: true,
      },
    }));

    if (bulkOperations.length > 0) {
      const [result, bulkErr] = await Db.bulkWrite({
        collection: COLLECTION_NAMES.SEARCHKEYWORDMODEL,
        operations: bulkOperations,
      });

      if (bulkErr) {
        throw new Error(
          `Error during bulk write in Keywords collection: ${bulkErr}`
        );
      }
    }

    return res.status(200).json({
      message: 'Keywords extracted and stored successfully',
      totalKeywords: keywordsSet.size,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      messsage: 'Error while extracting search keywords',
      error: error.message || error,
    });
  }
};

exports.fetchSearchSuggestions = async (req, res) => {
  try {
    const { categories = [], brands = [], search = '' } = req.body.filters;

    const [fetchAllProductHome, fetchAllProductHomeError] =
      await userProductHelper.fetchSuggestions(categories, brands, search);

    if (fetchAllProductHomeError === 'Categories do not exist!')
      return notFoundResponse({
        res,
        message: fetchAllProductHomeError,
      });

    if (fetchAllProductHomeError)
      return serverErrorResponse({
        res,
        error: fetchAllProductHomeError,
      });

    return successResponse({
      res,
      data: fetchAllProductHome,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      error: `Error while fetching products: ${error}`,
    });
  }
};

exports.fetchSearchProducts = async (req, res) => {
  try {
    const { offset = 0, limit = 10 } = req.query;
    const {
      categories = [],
      brands = [],
      search = '',
      sort = 'all',
      type,
    } = req.body.filters;

    let fetchAllProductHome, fetchAllProductHomeError;
    if (type === 'product')
      [fetchAllProductHome, fetchAllProductHomeError] =
        await userProductHelper.fetchProducts(
          offset,
          limit,
          categories,
          brands,
          search,
          sort,
          false
        );
    else if (type === 'brand')
      [fetchAllProductHome, fetchAllProductHomeError] =
        await userProductHelper.fetchClients(
          offset,
          limit,
          categories,
          brands,
          search,
          sort,
          false
        );
    else
      return badRequestResponse({
        res,
        message: 'Invalid Search Type',
      });

    if (fetchAllProductHomeError)
      return serverErrorResponse({
        res,
        error: fetchAllProductHomeError,
      });

    return successResponse({
      res,
      data: fetchAllProductHome,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      error: `Error while fetching products: ${error}`,
    });
  }
};

exports.fetchClosestProducts = async (req, res) => {
  try {
    const { offset = 0, limit = 10 } = req.query;
    const { search = '', sort = 'all' } = req.body.filters;

    const [fetchAllProductHome, fetchAllProductHomeError] =
      await userProductHelper.fetchClosestSearchProduct(search, limit);

    if (fetchAllProductHomeError === 'Categories do not exist!')
      return notFoundResponse({ res, message: fetchAllProductHomeError });

    if (fetchAllProductHomeError)
      return serverErrorResponse({ res, error: fetchAllProductHomeError });

    return successResponse({
      res,
      data: fetchAllProductHome,
    });
  } catch (error) {
    return serverErrorResponse({
      res,
      url: req.url,
      method: req.method,
      error: `Error while fetching products: ${error}`,
    });
  }
};
