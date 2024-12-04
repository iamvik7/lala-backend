const colors = require('colors');
const mongoose = require('mongoose');
const logger = require('./brain/utils/winston');
const app = require('./index'); // Import the Express app from index.js
const { PORT } = require('./brain/utils/config');
const connectDB = require('./brain/utils/dbConnect');

const port = PORT || 5050;

// Connect to the database and start the server
connectDB()
  .then(() => {
    logger.info('Database connected successfully');
    app.listen(port, () => {
      logger.info(colors.bgGreen(`Server Running On ${port}`));
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to the database', error);
  });

module.exports = app; // Exporting app for Vercel to use
