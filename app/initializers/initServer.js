import express from "express";
import * as middlewares from "../middlewares/index.js";
import initKidsRoutes from "./initKidsRoutes.js";

// import initDatabase from './initDatabase';
import momentTimeZone from "moment-timezone";

export default async (config) => {
  const app = express();
  const kidsRouter = express.Router();
  const parentsRouter = express.Router();

  // const db = await initDatabase(config);

  //kids
  kidsRouter.use(middlewares.apiMiddleware);
  initKidsRoutes(kidsRouter, app);

  //parents

  //
  app.use("/api", kidsRouter);
  app.use("/api", parentsRouter);

  return app;
};
