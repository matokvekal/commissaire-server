import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as middlewares from "../middlewares/index.js";
import initKidsRoutes from "./initKidsRoutes.js";
import initParentsRoutes from "./initParentsRoutes.js";
import initTempRoutes from "./initTempRoutes.js";
import initDatabase from "./initDatabase.js";
import SocketManager from "../handlers/websocketHandler.js";
import cors from "cors";
// import initDocumentDb from "./initDocumentDb.js";

export default async (config) => {
  console.log("Initializing server");
  const app = express();
  app.set("trust proxy", true); // Trust the proxy to get the correct client IP address
  const server = http.createServer(app);
  const io = new Server(server);
  const db = await initDatabase(config);
  if (config.use_mongo_db) {
    //replace  import initDocumentDb from "./initDocumentDb.js";
    const initDocumentDb = (await import("./initDocumentDb.js")).default;
    const documentDb = await initDocumentDb(config);
    app.set("documentDb", documentDb);
  }

  app.set("dbModels", db);

  SocketManager.initialize(io, db);

  io.use(middlewares.adaptedFileLoggerMiddleware);

  // Apply CORS middleware early
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:5000",
        "https://localhost:3000",
        "https://localhost:5000",
        "http://18.199.57.38:3000",
        "http://18.199.57.38:5000",
        "https://18.199.57.38:3000", 
        "https://18.199.57.38:5000",
        "http://18.199.57.38",
        "https://18.199.57.38"
      ],
      credentials: true, // <= Accept credentials (cookies) sent by the client
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
 // Log incoming requests
 app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});
  // Handle preflight requests
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
  });



  //kid
  const kidsRouter = express.Router();
  kidsRouter.use(middlewares.apiMiddleware);
  kidsRouter.use(middlewares.errorLoggerMiddleware(db));
  kidsRouter.use(middlewares.authenticationMiddleware(db));
  kidsRouter.use(middlewares.fileLoggerMiddlaware);

  initKidsRoutes(kidsRouter, app);

  //parent
  const parentsRouter = express.Router();
  parentsRouter.use(middlewares.apiMiddleware);
  parentsRouter.use(middlewares.errorLoggerMiddleware(db));
  parentsRouter.use(middlewares.authenticationMiddleware(db));
  parentsRouter.use(middlewares.fileLoggerMiddlaware);
  initParentsRoutes(parentsRouter, app);
  //

  //temp only for developers
  const tempRouter = express.Router();
  tempRouter.use(middlewares.apiMiddleware);
  tempRouter.use(middlewares.errorLoggerMiddleware(db));
  tempRouter.use(middlewares.authenticationMiddleware(db));
  tempRouter.use(middlewares.fileLoggerMiddlaware);
  initTempRoutes(tempRouter, app);

  app.use("/api", kidsRouter);
  app.use("/api", parentsRouter);
  app.use("/api", tempRouter);

  return { app, server, io };
};
