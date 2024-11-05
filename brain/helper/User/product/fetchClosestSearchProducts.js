const Db = require('../../../utils/db');
const { COLLECTION_NAMES, COLLECTIONS } = require('../../../utils/modelEnums');

const extractKeywords = async (search) => {
  const [keywordsFromDB, err] = await Db.fetchAll({
    collection: COLLECTION_NAMES.SEARCHKEYWORDMODEL,
    query: {},
    projection: { keyword: 1 },
  });
  if (err) {
    throw new Error(`Error fetching keywords from the database: ${err}`);
  }

  // Convert keywords to an array of strings
  const predefinedKeywords = keywordsFromDB.map((doc) =>
    doc.keyword.toLowerCase()
  );
  const lowerSearch = search.toLowerCase();
  const matchedKeywords = predefinedKeywords.filter((keyword) => {
    const regex = new RegExp(keyword, 'i');
    return regex.test(lowerSearch);
  });

  console.log('Extracted Keywords: ', matchedKeywords);
  return matchedKeywords;
};

exports.fetchClosestSearchProduct = async (search, limit = 20) => {
  try {
    const parsedLimit = parseInt(limit, 10);
    const searchLetters = search.split('').filter(Boolean);
    const extractedKeywords = await extractKeywords(search);
    // If keywords are found, prioritize searching using those keywords
    if (extractedKeywords.length > 0) {
      const regexKeywords = extractedKeywords.join('|');
      let [keywordMatchResults, errForKeywordMatch] = await Db.aggregate({
        collection: COLLECTION_NAMES.PRODUCTMODEL,
        query: [
          {
            $match: {
              isActive: true,
              $or: [
                {
                  name: {
                    $regex: regexKeywords,
                    $options: 'i',
                  },
                },
                {
                  description: {
                    $regex: regexKeywords,
                    $options: 'i',
                  },
                },
                {
                  tags: {
                    $elemMatch: {
                      $regex: regexKeywords,
                      $options: 'i',
                    },
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              titleMatch: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: '$name',
                      regex: regexKeywords,
                      options: 'i',
                    },
                  },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
          {
            $sort: { titleMatch: -1, totalLetterFrequency: -1 },
          },
          { $limit: parsedLimit },
          {
            $lookup: {
              from: COLLECTION_NAMES.CATEGORYMODEL,
              localField: 'categoryId',
              foreignField: '_id',
              as: 'category',
            },
          },
          {
            $addFields: {
              productCategory: {
                $arrayElemAt: ['$category.name', 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              description: 1,
              images: 1,
              categoryId: 1,
              productCategory: 1,
              views: 1,
            },
          },
        ],
      });

      if (errForKeywordMatch) return [null, errForKeywordMatch];
      if (keywordMatchResults.length > 0) {
        console.log('Keyword Match Results: ', keywordMatchResults.length);
        return [keywordMatchResults, null];
      }
    }

    // Fallback: Letter frequency search if no keyword matches are found
    const letterFrequencyStage = searchLetters.map((letter) => ({
      $addFields: {
        [`letterCount_${letter}`]: {
          $add: [
            {
              $size: {
                $split: [
                  {
                    $cond: {
                      if: {
                        $eq: [{ $type: '$name' }, 'string'],
                      },
                      then: '$name',
                      else: '',
                    },
                  },
                  letter,
                ],
              },
            },
            {
              $size: {
                $split: [
                  {
                    $cond: {
                      if: {
                        $eq: [{ $type: '$description' }, 'string'],
                      },
                      then: '$description',
                      else: '',
                    },
                  },
                  letter,
                ],
              },
            },
            {
              $size: {
                $split: [
                  {
                    $cond: {
                      if: {
                        $eq: [{ $type: '$tags' }, 'array'],
                      },
                      then: {
                        $reduce: {
                          input: '$tags',
                          initialValue: '',
                          in: { $concat: ['$$value', ' ', '$$this'] },
                        },
                      },
                      else: '$tags',
                    },
                  },
                  letter,
                ],
              },
            },
          ],
        },
      },
    }));

    const totalFrequencyStage = {
      $addFields: {
        totalLetterFrequency: {
          $sum: searchLetters.map((letter) => `$letterCount_${letter}`),
        },
      },
    };

    let [fallbackResults, errForFallback] = await Db.aggregate({
      collection: COLLECTION_NAMES.PRODUCTMODEL,
      query: [
        ...letterFrequencyStage,
        totalFrequencyStage,
        {
          $lookup: {
            from: COLLECTIONS.CATEGORY_COLLECTION,
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categories',
          },
        },
        {
          $addFields: {
            productCategory: {
              $arrayElemAt: ['$categories.name', 0],
            },
          },
        },
        { $sort: { totalLetterFrequency: -1 } },
        { $limit: parsedLimit },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            images: 1,
            categoryId: 1,
            productCategory: 1,
            totalLetterFrequency: 1,
          },
        },
      ],
    });
    if (errForFallback) return [null, errForFallback];

    return [fallbackResults, null];
  } catch (error) {
    console.log('Error: ', error.message);
    return [null, error.message];
  }
};
