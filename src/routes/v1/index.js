const { Router } = require("express");
const authRouter = require("./auth");
const userRouter = require("./user");
const adminRouter = require("./admin");
const superAdminRouter = require("./superadmin");

const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/superadmin", superAdminRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/user", userRouter);

module.exports = v1Router;
