import { ServerErrors } from "../config/serverMessages.js";
import { createErrorLog } from "../utils/apiLoggerUtils.js";


export const errorLoggerMiddleware = () => async (req, res, next) => {
  res.createErrorLogAndSend = async (db, {
      err = { message: "Server Error" }, // Default error message
      message = "An error occurred",    // Default log message
      status = 500                      // Default HTTP status code for errors
  }) => {
      const error = `${err.message || err} - ${message}`;

      // Call createErrorLog with the dynamically passed database handler
      await createErrorLog(db, req, error);
      return res.status(status).send({ message });
  };

  try {
      next(); // Proceed to the next middleware or route handler
  } catch (innerError) {
      console.error(`ERROR LOGGER FAILED - ${innerError}`);
      // Optionally, handle the failure of the next() call
      next(innerError); // Ensure the error is passed on to error-handling middleware
  }
};


