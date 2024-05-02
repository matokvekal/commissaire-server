import winston from "winston";

const Wlogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/log" }),
  ],
});

export default Wlogger;
