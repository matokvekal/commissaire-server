import mongoose from "mongoose";
import Logger from "../utils/logger.js";

const initDocumentDb = async (config) => {
  const { DB_USER, DB_PASSWORD, DOCUMENTDB_CLUSTER_URL, IS_AWS, DB_NAME } =
    config.mongoDB;

  // Setup URI based on environment (AWS or Local)
  try {
    let mongoURI;

    if (IS_AWS === true) {
      mongoURI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DOCUMENTDB_CLUSTER_URL}/?authSource=admin&authMechanism=SCRAM-SHA-256`;
      Logger.info("Connecting to MongoDB at AWS...");
    } else {
      mongoURI = `mongodb://localhost:27017/${DB_NAME}`;
      Logger.info("Connecting to local MongoDB...");
    }

    await mongoose.connect(mongoURI);
    Logger.info("MongoDB connected successfully.");
  } catch (error) {
    Logger.error("Failed to connect to MongoDB:", error);
  }

  return mongoose;
};

export default initDocumentDb;
