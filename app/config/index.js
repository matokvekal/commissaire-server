//import Logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

// import Logger from "../utils/logger.js";
import getModeFromEnv from "../utils/mode.js";
const mode = getModeFromEnv();
// const mode = process.env.MODE || "staging";
// const env = getModeFromEnv();
// Logger.debug(`Server is running in ${mode} mode`);
const configByEnv = {
  staging: {
    use_mongo_db: process.env.USE_MONGO_DB === false,
    database: {
      HOST_MYSQL: process.env.HOST_MYSQL,
      USER_MYSQL: process.env.USER_MYSQL,
      PORT_MYSQL: 3306,
      PASSWORD_MYSQL: process.env.DBPASSWORD_MYSQL,
      NAME_MYSQL: "koalidb",
      dialect: "mysql",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
    LocalmongoDB: {
      URI: "mongodb://localhost:27017/koalidb",
      options: {},
    },
    mongoDB: {
      DB_MONGO_USER: process.env.DB_MONGO_USER,
      DB_MONGO_PASSWORD: process.env.DB_MONGO_PASSWORD,
      DOCUMENTDB_CLUSTER_URL: process.env.DOCUMENTDB_CLUSTER_URL,
      IS_AWS: process.env.IS_AWS === "true",
      DB_MONGO_NAME: process.env.DB_MONGO_NAME,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    // Other settings...
    port: process.env.SERVER_PORT || 4000,
    allowedOrigins: "http://localhost:4000,http:127.0.0.1:4000",
    JWT_SECRET: process.env.JWT_SECRET || "KOALY_KEY_LOCAL",
    otpConfirmationLimitsMinutes: 20,
    otpExpirationTimeInMinutes: 10,
    tokenExpireDayLimit: 360,
    loggerDebounceAmountInMS: 60000,
    SMS_API_TOKEN: process.env.SMS_API_TOKEN,
    sms_api_url: process.env.SMS_API_URL,
    smsSenderPhone: "0542288530",
    smsSenderName: "KOALI_SITE",
    smsMessageInnerName: "koali_sms",
    sms_is_active: "true",
    sms_otp_attempt_limit: 3,
    allowedAmountOfRequestsForIpPerMinute: 600,
    allowedAmountOfRequestsForIpPerFullDay: 24 * 60 * 300,
    googlePhonenumber: "972111111111",
    gmailUserName: "_____.service@gmail.com",
    gmailPassword: process.env.GMAIL_PASSWORD,
    alertUtilUrl: "http://0.0.0.0:8089/updateAlerts/",
    passwordIncryptSalt: 10,
  },
  production: {
    database: {
      HOST: "___.rds.amazonaws.com",
      USER: "admin",
      PORT: 3306,
      PASSWORD: process.env.DBPASSWORD,
      NAME: "koal-staging",
      dialect: "mysql",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
    mongoDB: {
      URI: `mongodb://${process.env.DB_MONGO_USER}:${process.env.DB_MONGO_PASSWORD}@your-documentdb-cluster-url:27017/koal-staging?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`,
    },
    port: process.env.SERVER_PORT || 4000,
    allowedOrigins: "http://",
    JWT_SECRET: process.env.JWT_SECRET || "KOALY_KEY_LOCAL",
    otpConfirmationLimitsMinutes: 20,
    otpExpirationTimeInMinutes: 10,
    tokenExpireDayLimit: 360,
    loggerDebounceAmountInMS: 60000,
    smsSiteID: 35749,
    smsSitePassword: process.env.SMSPASSWORD,
    SMS_API_TOKEN: process.env.SMS_API_TOKEN,
    sms_otp_attempt_limit: 3,
    smsSenderPhone: "KOALI_SITE",
    smsMessageInnerName: "koali_sms",
    allowedAmountOfRequestsForIpPerMinute: 600,
    allowedAmountOfRequestsForIpPerFullDay: 24 * 60 * 300,
    googlePhonenumber: "972111111111",
    gmailUserName: "_____.service@gmail.com",
    gmailPassword: process.env.GMAIL_PASSWORD,
    alertUtilUrl: "http://0.0.0.0:8089/updateAlerts/",
    passwordIncryptSalt: 10,
  },
  // localhost: {
  //   database: {
  //     HOST: "___.rds.amazonaws.com",
  //     USER: "admin",
  //     PORT: 3306,
  //     PASSWORD: process.env.PASSWORD,
  //     NAME: "koal-staging",
  //     dialect: "mysql",
  //     pool: {
  //       max: 5,
  //       min: 0,
  //       acquire: 30000,
  //       idle: 10000,
  //     },
  //   },
  //   port: process.env.PORT || 5000,
  //   allowedOrigins: "http://",
  //   TOKEN_KEY: process.env.TOKEN || "KOALY_KEY_LOCAL",
  //   confirmationCodeLimit: 10,
  //   tokenExpireDayLimit: 30,
  //   loggerDebounceAmountInMS: 60000,
  //   smsSiteID: 35749,
  //   smsSitePassword: process.env.SMSPASSWORD,
  //   smsSenderPhone: "KOALI_SITE",
  //   smsMessageInnerName: "koali_sms",
  //   allowedAmountOfRequestsForIpPerMinute: 600,
  //   allowedAmountOfRequestsForIpPerFullDay: 24 * 60 * 300,
  //   googlePhonenumber: "972111111111",
  //   gmailUserName: "_____.service@gmail.com",
  //   gmailPassword: process.env.GMAIL_PASSWORD,
  //   alertUtilUrl: "http://0.0.0.0:8089/updateAlerts/",
  //   passwordIncryptSalt: 10,
  // },
};

export default configByEnv[mode];
