const colors = require('colors');
const logger = require('./brain/utils/winston');
const app = require('./index');
const { PORT } = require('./brain/utils/config');
const connectDB = require('./brain/utils/dbConnect');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'private-key.pem')),
  cert: fs.readFileSync(
    path.join(__dirname, 'certificates', 'public-cert.pem')
  ),
  allowHTTP1: true, // Enable fallback for HTTP/1.1
};

const port = PORT || 5050;

connectDB()
  .then(() => {
    logger.info('Database connected successfully');

    const server = http2.createSecureServer(options, app);

    server.listen(port, () => {
      logger.info(colors.bgGreen('HTTP/2 Server Running On' + ' ' + `${port}`));
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to the database', error);
  });
