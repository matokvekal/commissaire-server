import InitServer from "./app/initializers/initServer.js";
import config from "./app/config/index.js";
import fs from "fs";
import path from "path";
import Logger from "./app/utils/logger.js";
import morgan from "morgan";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
//   flags: "a",
// });
var accessLogStream = fs.createWriteStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

InitServer(config).then((app) => {
  app.use(morgan("combined", { stream: accessLogStream }));
  // Initialize application server
  app.listen(config.port, () =>
    Logger.debug(`Listening on port: ${config.port}`)
  );
});

//test to git:hub1
