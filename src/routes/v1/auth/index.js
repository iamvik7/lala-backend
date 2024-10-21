const { Router } = require('express');
const {
	isAuthenticated,
} = require('../../../../brain/middleware/isAuthenticated');
const Db = require('../../../../brain/utils/db');
const {
	login,
	register,
	logout,
} = require('../../../controller/v1/Auth/auth.controller');

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', isAuthenticated, logout);
authRouter.get('', isAuthenticated, async (req, res) => {
	const id = Db.mongoose.Types.ObjectId.createFromHexString(
		'6656bae7c7e2eb7976a52ad1'
	);
	console.log(id);
	return res.json('hello');
});

module.exports = authRouter;
