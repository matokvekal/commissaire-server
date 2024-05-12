import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as middlewares from "../middlewares/index.js";
import initKidsRoutes from "./initKidsRoutes.js";
import initParentsRoutes from "./initParentsRoutes.js";
import initDatabase from "./initDatabase.js";
import initializeSocketHandlers from "../handlers/websocketHandler.js";
import cors from "cors";
import initDocumentDb from "./initDocumentDb.js";

export default async (config) => {
  const app = express();
  app.set("trust proxy", true); // Trust the proxy to get the correct client IP address
  const server = http.createServer(app);
  const io = new Server(server);
  const db = await initDatabase(config);
  const documentDb = await initDocumentDb(config);
  app.set("dbModels", db);
  app.set("documentDb", documentDb); 
  // Initialize Socket.IO event handlers here with DB instance
  initializeSocketHandlers(io, db);
  //conect the middleware to socket
  io.use(middlewares.adaptedFileLoggerMiddleware);
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
  initParentsRoutes(kidsRouter, app);
  //

  app.use(
    cors({
      origin: [
        "http://localhost",
        "https://localhost",
        "https://localhost:3000",
      ], // (Whatever your frontend url is)
      credentials: true, // <= Accept credentials (cookies) sent by the client
    })
  );

  app.use("/api", kidsRouter);
  app.use("/api", parentsRouter);

  return { app, server, io };
};
