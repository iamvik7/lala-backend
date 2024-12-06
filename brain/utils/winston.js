const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, colorize } = format;

// Define a custom format for your logs
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create the logger
const logger = createLogger({
  level: 'info', // Set the minimum log level
  format: combine(
    timestamp(), // Add a timestamp to each log
    errors({ stack: true }) // Print stack trace for errors
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(), // Colorize logs for console
        customFormat
      ),
    }), // Log to the console
    // Remove or comment out the file transport since it won't work in Vercel
    // new transports.File({ filename: 'logs/app.log' }), // Log to a file
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
