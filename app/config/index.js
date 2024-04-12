//import Logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

import Logger from "../utils/logger.js";
import { getModeFromEnv } from "../utils/authenticationUtils.js";
const mode = getModeFromEnv();
// const mode = process.env.MODE || "staging";
const env = getModeFromEnv();
Logger.debug(`Server is running in ${mode} mode`);
const configByEnv = {
  staging: {
    database: {
      HOST: process.env.HOST,
      USER: process.env.USER,
      PORT: 3306,
      PASSWORD: process.env.DBPASSWORD,
      NAME: "koalidb",
      dialect: "mysql",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
    port: process.env.SERVER_PORT || 5000,
    allowedOrigins: "http://localhost:5000,http:127.0.0.1:5000",
    JWT_SECRET: process.env.JWT_SECRET || "KOALY_KEY_LOCAL",
    otpConfirmationLimitsSeconds: 10,

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
    port: process.env.SERVER_PORT || 5000,
    allowedOrigins: "http://",
    JWT_SECRET: process.env.JWT_SECRET || "KOALY_KEY_LOCAL",
    otpConfirmationLimitsSeconds: 20,
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
