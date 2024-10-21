const path = require('path');
const multer = require('multer');
const {
	CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET,
} = require('./config');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
	cloud_name: CLOUDINARY_CLOUD_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET,
});

// Define allowed file types and maximum file size
const ALLOWED_FILE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'application/pdf',
	'text/plain',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer for file upload
const storage = multer.memoryStorage(); // Use memory storage

exports.upload = multer({
	storage: storage,
	limits: {
		fileSize: MAX_FILE_SIZE, // Limit file size to defined max
	},
	fileFilter: (req, file, cb) => {
		console.log('In File Filter', file.originalname); // Log message for debugging
		let ext = path.extname(file.originalname); // Get file extension
		file.originalname = file.originalname.split(' ').join('_'); // Replace spaces in original filename with underscores

		// Check if file extension is one of the allowed types
		if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
			console.log(`Extension Check - ${file.originalname}`); // Log message for debugging
			cb(null, true); // Pass the file
		} else {
			cb(`Invalid file type: ${file.originalname}`, false); // Reject the file with an error message
		}
	},
});

// Function to validate file type and size
const validateFile = (file) => {
	// Validate file type
	if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
		throw new Error(`Invalid file type: ${file.originalname}`);
	}

	// Validate file size
	if (file.size > MAX_FILE_SIZE) {
		throw new Error(
			`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB: ${
				file.originalname
			}`
		);
	}
};

// Function to upload file to Cloudinary
exports.uploadToCloudinary = async (file, CLOUDINARY_BUCKET) => {
	return new Promise((resolve, reject) => {
		// Validate the file before uploading
		validateFile(file);

		const stream = cloudinary.uploader.upload_stream(
			{
				folder: CLOUDINARY_BUCKET,
				public_id: file.originalname,
				unique_filename: true,
				overwrite: false,
			},
			(error, result) => {
				if (error) {
					console.error('Error uploading file to Cloudinary:', error);
					return reject(new Error('Failed to upload file to Cloudinary'));
				}
				resolve(result); // Resolve with the secure URL
			}
		);

		// End the stream with the file buffer
		stream.end(file.buffer);
	});
};

// Function to delete file from Cloudinary
exports.deleteFromCloudinary = async (images) => {
	try {
		for (let image of images) {
			await cloudinary.uploader.destroy(image.title);
		}
		console.log('File deleted from Cloudinary.');
	} catch (error) {
		console.error('Error deleting file from Cloudinary:', error);
		throw new Error('Failed to delete file from Cloudinary');
	}
};
