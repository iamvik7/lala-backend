const colors = require("colors");
const mongoose = require("mongoose");
const logger = require("./brain/utils/winston");
const app = require("./index"); // get all the modele form the indexjs from modele.
const {
  PORT
} = require("./brain/utils/config");
const port = PORT || 5050;
const connectDB = require('./brain/utils/dbConnect');


// Connect to the database
connectDB().then(() => {
  logger.info("Database connected successfully");
  app.listen(port, () =>
    logger.info(colors.bgGreen("Server Running On" + " " + `${PORT}`))
  );
}).catch(error => {
  logger.error("Failed to connect to the database", error);
});