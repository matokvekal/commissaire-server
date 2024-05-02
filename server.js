import InitServer from "./app/initializers/initServer.js";
// import rfs from 'rotating-file-stream';
import winston from "winston";
// import morgan from "morgan";
import config from "./app/config/index.js";
import fs from "fs";
import path from "path";
import Logger from "./app/utils/logger.js";

import { fileURLToPath } from "url";
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
//   flags: "a",
// });

//just in case the log file is not exist
// const logDirectory = path.join(__dirname, "log");
// if (!fs.existsSync(logDirectory)) {
//   fs.mkdirSync(logDirectory, { recursive: true });
// }

// let accessLogStream = rfs.createStream('access.log', {
//   interval: "1d", // rotate daily
//   path: path.join(__dirname, "log"),
// });

InitServer(config).then((app) => {
  // app.use(morgan("combined", { stream: accessLogStream }));
  app.use((req, res, next) => {
    Logger.debug("Request received 3", req.path);
    next();
  });
  // Initialize application server
  app.listen(config.port, () =>
    Logger.debug(`Listening on port: ${config.port}`)
  );
});

//test to git:hub1
