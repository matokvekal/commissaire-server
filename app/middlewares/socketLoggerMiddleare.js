import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ServerNumbers } from "../constants/serverConstants.js";

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the log file in the 'logs' directory located appropriately
const logFilePath = path.join(__dirname, "..", "..", "logs", "socket.log");

let socketLogBuffer = "";
let socketLogCount = 0;

const adaptedFileLoggerMiddleware = (socket, next) => {
  try {
    // Log the connection event
    logEvent(
      `Connection - ${new Date().toISOString()} - IP: ${
        socket.handshake.address
      } - Socket ID: ${socket.id}`
    );

    // Set up listener for message events (or any other event you are interested in)
    socket.on("message", (message) => {
      logEvent(
        `Message - ${new Date().toISOString()} - Socket ID: ${
          socket.id
        } - Message: ${message}`
      );
    });

    // Example for another type of event, such as "disconnect"
    socket.on("disconnect", (reason) => {
      logEvent(
        `Disconnect - ${new Date().toISOString()} - Socket ID: ${
          socket.id
        } - Reason: ${reason}`
      );
    });

    next();
  } catch (err) {
    console.error(`ERROR LOGGER FAILED - ${err}`);
    next("Some error occurred");
  }
};

// Function to handle log buffering and writing
function logEvent(log) {
  socketLogBuffer += log + "\n";
  socketLogCount++;
  if (socketLogCount >= ServerNumbers.maxSocketLogsBeforeWrite) {
    fs.appendFile(logFilePath, socketLogBuffer, "utf8", (err) => {
      if (err) {
        console.error(`Failed to write logs: ${err}`);
      }
      socketLogBuffer = "";
      socketLogCount = 0;
    });
  }
}

export default adaptedFileLoggerMiddleware;
