const { deleteFromCloudinary } = require('../../utils/cloudinary');
const Db = require('../../utils/db');

exports.ImageDeleteHelper = async ({
  fileId,
  uuid,
  collection,
  type,
  product = false,
  session,
}) => {
  try {
    const [findFile, findFileError] = await Db.fetchOne({
      collection,
      query: { _id: fileId },
    });

    if (!findFile) return [null, findFileError.message || findFileError];

    if (!findFile) return [null, 'file not exists!'];

    if (product) {
      let imageObj;
      const indexToRemoveImages = findFile.images.findIndex(
        (each) => each.uuid === uuid
      );

      if (indexToRemoveImages !== -1) {
        imageObj = findFile.images[indexToRemoveImages];
        findFile.images.splice(indexToRemoveImages, 1);
      } else if (indexToRemoveImages === -1) {
        return [null, 'Image not found in  the product'];
      }
      const [result, errorUpdate] = await Db.findByIdAndUpdate({
        collection,
        id: fileId,
        body: {
          images: findFile.images,
        },
        session: session,
      });
      if (errorUpdate) return [null, errorUpdate];

      if (result) await deleteFromCloudinary([imageObj]);

      return [true, null];
    }

    if (type === 'logo') {
      let deleteLogo = [];

      if (findFile?.logo?.uuid !== uuid) {
        await session.abortTransaction();
        await session.endSession();
        return notFoundResponse({
          res,
          message: 'File logo not exists!',
        });
      } else {
        const [fileUpdate, fileUpdateError] = await Db.findByIdAndUpdate({
          collection,
          id: fileId,
          body: {
            $set: {
              logo: null,
            },
          },
          session,
        });

        if (fileUpdateError)
          return [null, fileUpdateError.message || fileUpdateError];
      }

      deleteLogo.push(findFile?.logo);
      if (fileUpdate) await deleteFromCloudinary(brandLogo);

      if (fileUpdate) return [true, null];
    } else if (type === 'icon') {
      let deleteIcon = [];

      if (findFile?.icon?.uuid !== uuid) {
        await session.abortTransaction();
        await session.endSession();
        return notFoundResponse({
          res,
          message: 'File icon not exists!',
        });
      } else {
        const [fileUpdate, fileUpdateError] = await Db.findByIdAndUpdate({
          collection,
          id: fileId,
          body: {
            $set: {
              icon: null,
            },
          },
          session,
        });

        if (fileUpdateError)
          return [null, fileUpdateError.message || fileUpdateError];
      }
      deleteLogo.push(deleteIcon?.logo);
      if (fileUpdate) await deleteFromCloudinary(deleteIcon);

      if (fileUpdate) return [true, null];
    }
  } catch (error) {
    return [null, error.message || error];
  }
};
