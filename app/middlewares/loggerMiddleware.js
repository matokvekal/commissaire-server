import { ServerErrors } from "../constants/constantMessages.js";
import { createErrorLog } from "../utils/apiLoggerUtils.js";

export const errorLoggerMiddleware = () => async (req, res, next) => {
  res.createErrorLogAndSend = async (
    db,
    {
      err = { message: "Server Error" }, // Default error message
      message = "An error occurred", // Default log message
      status = 500, // Default HTTP status code for errors
      code = null, // Optional error code for new clients
      details = null, // Optional additional details
    } = {}
  ) => {
    const errorLogMessage = `${err.message || err} - ${message}`;
    await createErrorLog(db, req, errorLogMessage);

    // Build response object with conditionally included fields
    const response = {
      message,
      status,
      ...(code && { code }), // Include code only if it has a value
      ...(details && { details }), // Include details only if it has a value
    };

    return res.status(status).json(response);
  };

  try {
    next(); // Proceed to the next middleware or route handler
  } catch (innerError) {
    console.error(`ERROR LOGGER FAILED - ${innerError}`);
    next(innerError); // Pass the error to subsequent error-handling middleware
  }
};

// import { ServerErrors } from "../constants/constantMessages.js";
// import { createErrorLog } from "../utils/apiLoggerUtils.js";

// export const errorLoggerMiddleware = () => async (req, res, next) => {
//   res.createErrorLogAndSend = async (
//     db,
//     {
//       err = { message: "Server Error" }, // Default error message
//       message = "An error occurred", // Default log message
//       status = 500, // Default HTTP status code for errors
//       code = null, // Optional error code for new clients
//       details = null, // Optional additional details
//     }
//   ) => {
//     const error = `${err.message || err} - ${message}`;
//     await createErrorLog(db, req, error);
//     return res.status(status).send({ message, status, code, details });
//   };

//   try {
//     next(); // Proceed to the next middleware or route handler
//   } catch (innerError) {
//     console.error(`ERROR LOGGER FAILED - ${innerError}`);
//     // Optionally, handle the failure of the next() call
//     next(innerError); // Ensure the error is passed on to error-handling middleware
//   }
// };
