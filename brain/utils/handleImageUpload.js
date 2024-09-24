const { v4: uuidv4 } = require("uuid"); // Adjust the path as necessary
const { uploadToCloudinary } = require("./cloudinary");
const sharp = require("sharp");

/**
 * Handles the upload of images to Cloudinary.
 * @param {Array} images - Array of image files to upload.
 * @param {string|Array} title - Title(s) for the images.
 * @param {string} categoryName - Folder name in Cloudinary where images will be stored.
 * @returns {Promise<Array>} - Returns an array of uploaded image data or an error message.
 */
exports.handleImageUpload = async (images, categoryName) => {
  try {
    if (!images || images.length === 0) return [null, "No images provided"];

    // Convert title to an array if it's a string

    const uploadedImages = await Promise.all(
      images.map(async (image) => {
        const resizedBuffer = await sharp(image.buffer)
          .resize(420, 420, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          }) // Resize to a width of 420px (adjust as needed)
          .jpeg({ quality: 90 }) // Convert to JPEG format (adjust as needed)
          .toBuffer();
        const result = await uploadToCloudinary(
          {
            ...image,
            buffer: resizedBuffer, // Use the resized buffer instead of the original
          },
          categoryName
        );
        return {
          uuid: uuidv4(), // Generate a unique identifier for each image
          title: result.public_id,
          url: result.secure_url,
          contentType: image.mimetype,
        };
      })
    );

    return [uploadedImages, null]; // Return uploaded images and no error
  } catch (error) {
    console.error("Error handling image upload:", error);
    return [null, error.message]; // Return null and error message
  }
};
