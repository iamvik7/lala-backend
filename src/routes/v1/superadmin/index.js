const { Router } = require("express");
const adminUpdateRouter = require("./admin");
const superadminCategoryRouter = require("./category");

const superAdminRouter = Router();

superAdminRouter.use("/admin", adminUpdateRouter);
superAdminRouter.use("/category", superadminCategoryRouter);


module.exports = superAdminRouter;
