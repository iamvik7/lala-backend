const { JWT_SECRET } = require('../utils/config');
const Db = require('../utils/db');
const { COLLECTION_NAMES } = require('../utils/modelEnums');
const jwt = require('jsonwebtoken');
const {
	badRequestResponse,
	unauthorizedResponse,
	unprocessableEntityResponse,
} = require('../utils/response');

exports.isAuthenticated = async (req, res, next) => {
	const { token } = req.cookies;

	if (!token) {
		return unauthorizedResponse({
			res,
			message: 'You must be login to access this resource',
		});
	}
	try {
		const decode = jwt.verify(token, JWT_SECRET);
		const [findId, findIdError] = await Db.fetchOne({
			collection: COLLECTION_NAMES.USERMODEL,
			query: { _id: decode.id },
		});

		if (findIdError || !findId) {
			req.clearCookie('token');
			return badRequestResponse({
				res,
				message: 'User error, please log in again!',
			});
		}
		req.user = decode;
		next();
	} catch (error) {
		res.clearCookie('token');
		return badRequestResponse({
			res,
			message: 'Kindly login again!',
			error: error.message || error,
		});
	}
};
