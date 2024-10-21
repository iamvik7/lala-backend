const mongoose = require('mongoose');
const colors = require('colors');
const logger = require('./winston');
const {
	DB_USER,
	DB_PASS,
	DB_SV,
	DB_NAME,
	NODE_ENV,
	DB_TYPE,
} = require('./config');

const connectDB = async () => {
	try {
		await mongoose.connect(
			`mongodb+srv://${DB_USER}:${DB_PASS}@${DB_SV}/${DB_NAME}?retryWrites=true&w=majority`
		);
		logger.info(
			'DB Connected---->' +
				`${DB_TYPE}`.bgRed +
				'<----' +
				' ' +
				`${DB_NAME}`.bgYellow +
				'Env type ' +
				`${NODE_ENV}`.bgMagenta
		);
	} catch (error) {
		logger.error('Error connecting to database: ', error);
		process.exit(1);
	}
};

module.exports = connectDB;
