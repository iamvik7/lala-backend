const multer = require('multer');
const { productService } = require('../../../../../brain/helper/Product');
const Db = require('../../../../../brain/utils/db');
const { PRODUCT_IMAGES } = require('../../../../../brain/utils/enums');
const { COLLECTION_NAMES } = require('../../../../../brain/utils/modelEnums');
const {
	serverErrorResponse,
	badRequestResponse,
	unprocessableEntityResponse,
	successResponse,
	limitExceeded,
	notFoundResponse,
} = require('../../../../../brain/utils/response');
const { productSchema } = require('../../../../joi/v1/Product');
const {
	deleteFromCloudinary,
	upload,
} = require('../../../../../brain/utils/cloudinary');
const {
	handleImageUpload,
} = require('../../../../../brain/utils/handleImageUpload');
const {
	CLOUDINARY_PRODUCT_BUCKET,
} = require('../../../../../brain/utils/config');

exports.addProduct = async (req, res) => {
	const session = await Db.mongoose.startSession();
	session.startTransaction();
	try {
		const UploadMultiple = upload.fields([
			{ name: PRODUCT_IMAGES.IMAGES, maxCount: 10 },
		]);

		let uploadedImages = [];
		UploadMultiple(req, res, async (error) => {
			if (error instanceof multer.MulterError) {
				// return res.json(error)
				console.error('error in multer file upload : ', error);
				if (error === 'File too large' || error.message === 'File too large') {
					return limitExceeded({
						res,
						message:
							'Image size is too large only image upto 10 MB is supported!',
						error: error.message || error,
					});
				}
				await session.abortTransaction();
				await session.endSession();
				return serverErrorResponse({
					res,
					message: error.message || error,
				});
			}

			if (!req.files || !req.files[PRODUCT_IMAGES.IMAGES]) {
				await session.abortTransaction();
				await session.endSession();
				return badRequestResponse({
					res,
					message: 'Required images are missing.',
				});
			}

			if (
				req.files &&
				(req.files[PRODUCT_IMAGES.IMAGES].length > 5 ||
					req.files[PRODUCT_IMAGES.IMAGES].length < 2)
			) {
				await session.abortTransaction();
				await session.endSession();
				return badRequestResponse({
					res,
					message: 'Minimum 2 and maximum 5 images are allowed!',
				});
			}

			try {
				if (req.body.tags) req.body.tags = JSON.parse(req.body.tags);
				const valid = productSchema.productValidator.validate(req.body, {
					abortEarly: true,
				});

				if (valid.error) {
					await session.abortTransaction();
					await session.endSession();
					return badRequestResponse({
						res,
						error: valid.error.message,
					});
				}

				const [images, imagesError] = await handleImageUpload(
					req.files[PRODUCT_IMAGES.IMAGES],
					CLOUDINARY_PRODUCT_BUCKET
				);

				if (imagesError) {
					await session.abortTransaction();
					await deleteFromCloudinary(images);
					await session.endSession();
					return serverErrorResponse({
						res,
						error: imagesError.message || imagesError,
						url: req.url,
						method: req.method,
					});
				}

				uploadedImages.push(images);

				const {
					name,
					description,
					price,
					quantity,
					stock,
					weight,
					tags,
					categoryId,
					brandId,
				} = req.body;

				const [fetchBrand, fetchBrandError] = await Db.fetchOne({
					collection: COLLECTION_NAMES.BRANDMODEL,
					query: { _id: brandId },
				});

				if (fetchBrandError) {
					await session.abortTransaction();
					await deleteFromCloudinary(uploadedImages.flat());
					await session.endSession();
					return serverErrorResponse({
						res,
						error: fetchBrandError.message || fetchBrandError,
					});
				}

				if (!fetchBrand || fetchBrand === null) {
					await session.abortTransaction();
					await deleteFromCloudinary(uploadedImages.flat());
					await session.endSession();
					return notFoundResponse({
						res,
						message: 'Brand not exist',
					});
				}

				const [product, productError] = await productService.createProduct({
					name,
					description,
					price,
					quantity,
					stock,
					weight,
					images,
					tags,
					categoryId,
					brandId,
					userId: req.user.id,
					session,
				});

				if (productError) {
					await session.abortTransaction();
					await session.endSession();
					return unprocessableEntityResponse({
						res,
						error: productError.message || productError,
					});
				}

				await session.commitTransaction();
				await session.endSession();
				return successResponse({
					res,
					data: product,
				});
			} catch (error) {
				await session.abortTransaction();
				await deleteFromCloudinary(uploadedImages.flat());
				await session.endSession();
				return serverErrorResponse({
					res,
					message: 'Error while creating product!',
					error: error.message || error,
				});
			}
		});
	} catch (error) {
		await session.abortTransaction();
		await session.endSession();
		return serverErrorResponse({
			res,
			message: 'Error while creating product!',
			error: error.message || error,
		});
	}
};

exports.getSpecificProduct = async (req, res) => {
	try {
		const { productId } = req.params;
		console.log(productId);
		const [product, productError] = await Db.fetchOne({
			collection: COLLECTION_NAMES.PRODUCTMODEL,
			query: { _id: productId },
			// projection: {__v: 0, createdBy:}
		});

		if (productError) {
			return serverErrorResponse({
				res,
				message: 'Error while fetching product details!',
				error: productError.message || productError,
			});
		}

		if (!product) {
			return badRequestResponse({
				res,
				message: 'Product not found with this id!',
			});
		}
		return successResponse({
			res,
			data: { product, instock: product.stock > 5 },
		});
	} catch (error) {
		return serverErrorResponse({
			res,
			message: 'Error while fetching product details!',
			error: error.message || error,
		});
	}
};
