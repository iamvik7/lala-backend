const {
	categoryBinService,
} = require('../../../../../brain/helper/Category/Bin');
const {
	RESTOREERROR,
} = require('../../../../../brain/helper/Category/Bin/categoryRestore');
const Db = require('../../../../../brain/utils/db');
const {
	serverErrorResponse,
	unprocessableEntityResponse,
	successResponse,
	unauthorizedResponse,
} = require('../../../../../brain/utils/response');

exports.deleteCategory = async (req, res) => {
	const session = await Db.mongoose.startSession();
	session.startTransaction();
	try {
		const [deleteCategory, deleteCategoryError] =
			await categoryBinService.categoryDelete(req.params.categoryId, session);
		if (deleteCategoryError) {
			await session.abortTransaction();
			await session.endSession();
			return unprocessableEntityResponse({
				res,
				error: deleteCategoryError.message || deleteCategoryError,
			});
		}

		await session.commitTransaction();
		await session.endSession();
		return successResponse({
			res,
			data: deleteCategory,
		});
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		return serverErrorResponse({
			res,
			message: 'Error while deleting category!',
			error: error.message || error,
		});
	}
};

exports.categoryRestore = async (req, res) => {
	const session = await Db.mongoose.startSession();
	session.startTransaction();
	try {
		const [restoredCategory, restoredCategoryError] =
			await categoryBinService.categoryRstore(req.params.categoryId, session);
		console.log(restoredCategoryError === RESTOREERROR.ISSUBCATEGORYERROR);
		if (restoredCategoryError === RESTOREERROR.ISSUBCATEGORYERROR) {
			await session.abortTransaction();
			await session.endSession();
			return successResponse({
				res,
				message: `To restore ${restoredCategory.name}, you have to restore: ${restoredCategory.grandParent}!`,
				data: restoredCategory,
			});
		}
		if (restoredCategoryError) {
			await session.abortTransaction();
			await session.endSession();
			return unprocessableEntityResponse({
				res,
				error: restoredCategoryError.message || restoredCategoryError,
			});
		}

		await session.commitTransaction();
		await session.endSession();
		return successResponse({
			res,
			data: restoredCategory,
		});
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		return serverErrorResponse({
			res,
			message: 'Error while restoring category!',
			error: error.message || error,
		});
	}
};
