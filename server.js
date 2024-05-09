import initServer from "./app/initializers/initServer.js";
// import initializeSocketHandlers from "./app/handlers/websocketHandler.js";
import config from "./app/config/index.js";
import Logger from "./app/utils/logger.js";
initServer(config).then(({ app, server, io }) => {
  // Add middleware for logging requests
  app.use((req, res, next) => {
    Logger.debug("Request received:", req.path);
    next();
  });

  // Start the server
  server.listen(config.port, () => {
    Logger.debug(`Server listening on port: ${config.port}`);
  });

  // Initialize Socket.IO event handlers
  // initializeSocketHandlers(io);

});

//test to git:hub1
