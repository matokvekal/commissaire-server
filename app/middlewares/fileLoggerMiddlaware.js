import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import logSchema from "../models/logSchema.js";
import { ServerNumbers } from "../constants/serverConstants.js";

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the log file in the 'logs' directory located two levels up from the current directory
const logFilePath = path.join(__dirname, "..", "..", "logs", "app.log");

const Log = mongoose.model("Koali_log", logSchema); // Ensure mongoose is properly imported

let visitors = 0;
let bufferedLogs = "";
let logCount = 0;

// Helper function to write logs to a file
function writeLogsToFile() {
  debugger
  fs.appendFile(logFilePath, bufferedLogs, "utf8", (err) => {
    if (err) {
      console.error(`Failed to write logs: ${err}`);
    }
    bufferedLogs = "";
    logCount = 0;
  });
}
function writeLogsToMongo(logEntry) {
  console.log("Attempting to write to MongoDB:", logEntry); // Log the entry to be saved
  Log.create(logEntry).catch((err) => {
    console.error(`Failed to save log to MongoDB: ${err}`);
  });
}

const fileLoggerMiddleware = (req, res, next) => {
  try {
    
    visitors += 1;
    const logEntry = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      visitorCount: visitors,
    };
    const logString = `${logEntry.timestamp.toISOString()} - ${
      logEntry.method
    } ${logEntry.path} - IP: ${logEntry.ip} - visitors: ${
      logEntry.visitorCount
    }\n`;

    // Buffer the log
    bufferedLogs += logString;
    logCount++;

    // Check if it's time to write to the file or MongoDB
    if (logCount >= ServerNumbers.maxLogsBeforeWrite) {
      writeLogsToFile(); // Log to file
      //writeLogsToMongo(logEntry); // Log to MongoDB check if mongo is active
    }

    next();
  } catch (err) {
    console.error(`ERROR LOGGER FAILED - ${err}`);
    next("Some error occurred");
  }
};

export default fileLoggerMiddleware;
