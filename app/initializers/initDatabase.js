import Sequelize from "sequelize";
// import Logger from "../utils/Logger.js";
// import initDatabaseModels from "./initDatabaseModels";
import Logger from "../utils/logger.js";

export default async (config) => {
  console.log(
    "Initializing DB",
    config.database.NAME_MYSQL,
    config.database.USER_MYSQL,
    config.database.PASSWORD_MYSQL,
    config.database.HOST_MYSQL,
    config.database.PORT_MYSQL,
    config.SMS_API_TOKEN
  );
  const sequelize = new Sequelize(
    config.database.NAME_MYSQL,
    config.database.USER_MYSQL,
    config.database.PASSWORD_MYSQL,
    {
      host: config.database.HOST_MYSQL,
      port: config.database.PORT_MYSQL,
      dialect: config.database.dialect,

      logging: false, // remove console.logs
      pool: {
        max: config.database.pool.max,
        min: config.database.pool.min,
        acquire: config.database.pool.acquire,
        idle: config.database.pool.idle,
      },

      // 	dialectOptions: {
      // 		useUTC: false, //for reading from database
      // 		dateStrings: true,
      // 		typeCast: true
      //   },
      //   timezone: '+02:00' //for writing to database
    }
  );

  const db = { sequelize };
  // const models = await initDatabaseModels(db);

  // Assign models objects to db object
  // Object.assign(db, models);

  try {
    await sequelize.authenticate();
    Logger.info("Connection has been established successfully.");
  } catch (error) {
    Logger.error("Unable to connect to the database:", error);
  }

  Logger.debug("Finished initializing DB");

  return db;
};
