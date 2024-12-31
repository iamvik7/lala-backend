const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const logger = require("./brain/utils/winston");
const { NODE_ENV } = require("./brain/utils/config");
const crypto = require("crypto");
const v1Router = require("./src/routes/v1");

const app = express();

const corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(cookieParser());
app.set("trust proxy", true);

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/v1", v1Router);

app.get("/", (req, res, next) => {
  res.status(200).json({
    message: `Backend service is running and up!!!!!!!!!!!`,
  });
});

module.exports = app;
