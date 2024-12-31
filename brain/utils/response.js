const { EXPIRE_TOKEN } = require("./config.js");
const logger = require("./winston.js");

const status = {
  SUCCESS: true,
  FAILURE: false,
};

const ResponseStatus = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  PAYMENT_REQUIRED: 402,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  ACCESS_DENIED: 440,
  INTERNAL_ERROR: 500,
  ALREADY_EXISTS: 409,
  NOT_ALLOWED: 405,
  LIMIT_EXCEEDED: 429,
  TEMPORARY_REDIRECT: 307,
};

const successResponse = ({ res, message, data }) => {
  if (data) {
    return res.status(ResponseStatus.SUCCESS).send({
      success: status.SUCCESS,
      message,
      data: data,
    });
  }
  return res.status(ResponseStatus.SUCCESS).send({
    success: status.SUCCESS,
    message,
  });
};

const outOfStockError = ({ res, message, data }) => {
  if (data) {
    return res.status(ResponseStatus.UNPROCESSABLE_ENTITY).send({
      success: status.FAILURE,
      message,
      data: data,
    });
  }
};
const alreadyExists = ({ res, message, data }) => {
  return res.status(ResponseStatus.ALREADY_EXISTS).send({
    success: status.FAILURE,
    message,
    data,
  });
};
const createdSuccessResponse = ({ res, message, data }) => {
  return res.status(ResponseStatus.CREATED).send({
    success: status.SUCCESS,
    message,
    data,
  });
};

const notFoundResponse = ({ res, message, error }) => {
  if (!message)
    message = "Resource not found. Please try again later or contact support";
  if (!error) error = message;
  return res.status(ResponseStatus.NOT_FOUND).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};

const unauthorizedResponse = ({ res, message, error }) => {
  if (!message)
    message = "Unauthorized. Please check your credentials or contact support";
  if (!error) error = message;
  return res.status(ResponseStatus.UNAUTHORIZED).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};

const badRequestResponse = ({ res, message, error, data }) => {
  if (!message)
    message = "Invalid request. Please try again later or contact support";
  if (!error) error = message;
  if (data) {
    return res.status(ResponseStatus.BAD_REQUEST).send({
      success: status.FAILURE,
      data: data,
      message: message,
      error: error,
    });
  }
  return res.status(ResponseStatus.BAD_REQUEST).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};

const forbiddenResponse = ({ res, message, error, data = null }) => {
  if (!message)
    message = "Access denied. Please contact support for assistance";
  if (!error) error = message;
  return res.status(ResponseStatus.FORBIDDEN).send({
    success: status.FAILURE,
    message: message,
    data,
    error: error,
  });
};
const temporaryRedirectResponse = ({ res, message, error, data = null }) => {
  if (!message)
    message = "Access denied. Please contact support for assistance";
  if (!error) error = message;
  return res.status(ResponseStatus.TEMPORARY_REDIRECT).send({
    success: status.FAILURE,
    message: message,
    data,
    error: error,
  });
};

const serverErrorResponse = async ({
  res,
  message,
  error,
  url = null,
  method = null,
}) => {
  try {
    if (!message)
      message = "An error occurred, please try again later or contact support";
    if (!error) error = message;

    console.log("server error response here: ", message, error);
    return res.status(ResponseStatus.INTERNAL_ERROR).send({
      success: status.FAILURE,
      message: message,
      error: error,
    });
  } catch (error) {
    logger.error("Error :", error);
    return res.status(ResponseStatus.INTERNAL_ERROR).send({
      success: status.FAILURE,
      message: message,
      error: error.message,
    });
  }
};

const accessDeniedResponse = ({ res, message, error }) => {
  if (!message)
    message = "Access denied. Please contact support for assistance";
  if (!error) error = message;
  return res.status(ResponseStatus.ACCESS_DENIED).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};
const notAllowedResponse = ({ res, message, error }) => {
  if (!message) message = "Method Not Allowed";
  if (!error) error = message;
  return res.status(ResponseStatus.NOT_ALLOWED).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};

const unprocessableEntityResponse = ({ res, message, error }) => {
  // so that we can see why JOI failed in logs while debugging
  if (error) console.error(`JOI validation failed: ${error}`);
  if (!message)
    message =
      "We're unable to fulfill your request at this time. Please try again later or contact support";
  if (!error) error = message;
  return res.status(ResponseStatus.UNPROCESSABLE_ENTITY).send({
    success: status.FAILURE,
    message: message,
    error: error,
  });
};

const paymentRequiredResponse = ({ res, message, data, error }) => {
  if (!message)
    message =
      "Payment required. Please complete the payment process or contact support";
  if (!error) error = message;
  return res.status(ResponseStatus.PAYMENT_REQUIRED).send({
    success: status.FAILURE,
    message: message,
    data,
    error: error,
  });
};
const limitExceeded = ({ res, message, data, error }) => {
  if (!message) message = "You have exceeded the limit.";
  if (!error) error = message;
  return res.status(ResponseStatus.LIMIT_EXCEEDED).send({
    success: status.FAILURE,
    message: message,
    data,
    error: error,
  });
};

const cookieResponse = ({ res, data }) => {
  let payload = {
    secure: true,
    httpOnly: true,
    sameSite: "None",
    expiresIn: EXPIRE_TOKEN,
  };

  res.cookie("token", data?.token);
  res.cookie("userDetails", data?.user);

  return res.status(ResponseStatus.SUCCESS).json({
    success: true,
    token: data?.token,
    payload,
    userDetials: data?.user,
  });
};

module.exports = {
  successResponse,
  createdSuccessResponse,
  notFoundResponse,
  unauthorizedResponse,
  badRequestResponse,
  forbiddenResponse,
  serverErrorResponse,
  accessDeniedResponse,
  unprocessableEntityResponse,
  paymentRequiredResponse,
  cookieResponse,
  alreadyExists,
  notAllowedResponse,
  limitExceeded,
  temporaryRedirectResponse,
  outOfStockError,
};
