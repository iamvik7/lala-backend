const { v4: uuidv4 } = require('uuid'); // Adjust the path as necessary
const { uploadToCloudinary } = require('./cloudinary');
const sharp = require('sharp');

/**
 * Handles the upload of images to Cloudinary.
 * @param {Array} images - Array of image files to upload.
 * @param {string} categoryName - Folder name in Cloudinary where images will be stored.
 * @returns {Promise<Array>} - Returns an array of uploaded image data or an error message.
 */
exports.handleImageUpload = async (images, categoryName) => {
	try {
		if (!images || images.length === 0) return [null, 'No images provided'];

		const uploadedImages = await Promise.all(
			images.map(async (image) => {
				const resizedBuffer = await sharp(image.buffer)
					.resize(2000, 2000, {
						fit: sharp.fit.inside,
						withoutEnlargement: true,
					})
					.jpeg({ quality: 55 })
					.toBuffer();

				const result = await uploadToCloudinary(
					{
						...image,
						buffer: resizedBuffer,
					},
					categoryName,
					[
						{ width: 1000, crop: 'scale' },
						{ quality: 'auto:best' },
						{ fetch_format: 'auto' },
					]
				);

				return {
					uuid: uuidv4(),
					title: result.public_id,
					url: result.secure_url,
					contentType: image.mimetype,
				};
			})
		);

		return [uploadedImages, null]; // Return uploaded images and no error
	} catch (error) {
		console.error('Error handling image upload:', error);
		return [null, error.message]; // Return null and error message
	}
};
