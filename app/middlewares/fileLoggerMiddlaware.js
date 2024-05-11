import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ServerNumbers } from "../constants/serverConstants.js";

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the log file in the 'logs' directory located two levels up from the current directory
const logFilePath = path.join(__dirname, "..", "..", "logs", "app.log");

let visitors = 0;
let bufferedLogs = "";
let logCount = 0;

const fileLoggerMiddleware = (req, res, next) => {
  try {
    visitors += 1;
    const log = `${new Date().toISOString()} - ${req.method} ${
      req.path
    } - IP: ${req.ip} - visitors: ${visitors}\n`;

    // Buffer the log
    bufferedLogs += log;
    logCount++;

    // Check if it's time to write to the file
    if (logCount >= ServerNumbers.maxLogsBeforeWrite) {
      fs.appendFile(logFilePath, bufferedLogs, "utf8", (err) => {
        if (err) {
          console.error(`Failed to write logs: ${err}`);
        }
      });
      // Reset the buffer and counter
      bufferedLogs = "";
      logCount = 0;
    }

    next();
  } catch (err) {
    console.error(`ERROR LOGGER FAILED - ${err}`);
    next("Some error occurred");
  }
};

export default fileLoggerMiddleware;
