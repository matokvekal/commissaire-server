import express from "express";
import * as middlewares from "../middlewares/index.js";
import initKidsRoutes from "./initKidsRoutes.js";
import initParentsRoutes from "./initParentsRoutes.js";
import initDatabase from "./initDatabase.js";
import cors from "cors";

export default async (config) => {
  const app = express();
  const kidsRouter = express.Router();
  const parentsRouter = express.Router();

  const db = await initDatabase(config);
  app.set("dbModels", db);

  //kid
  kidsRouter.use(middlewares.apiMiddleware);
  kidsRouter.use(middlewares.errorLoggerMiddleware(db));
  kidsRouter.use(middlewares.authenticationMiddleware(db));

  initKidsRoutes(kidsRouter, app);

  //parent
  parentsRouter.use(middlewares.apiMiddleware);
  parentsRouter.use(middlewares.errorLoggerMiddleware(db));
  parentsRouter.use(middlewares.authenticationMiddleware(db));

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

  return app;
};
