const { Router } = require("express");
const { register, login, logout } = require("../../../controller/v1/auth/auth.controller");
const { isAuthenticated } = require("../../../../brain/middleware/isAuthenticated");

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', isAuthenticated, logout);
authRouter.get('', isAuthenticated,  async (req, res) => {
    console.log(req.user)
    return res.json("hello");
})

module.exports = authRouter;