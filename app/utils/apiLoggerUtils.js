import moment from "moment";
import config from "../config/index.js";
import { QueryTypes } from "sequelize";

export const createSingleLog = async (sequelize, req, message, controller) => {
  try {
    const date = moment().toDate();
    const ip = req.socket.remoteAddress;
    const path = req.path;
    controller = controller ? controller : "";
    const SQL = `INSERT INTO logs (date, ip, path,controler, message, createdAt, updatedAt)
					 VALUES (:date, :ip, :path,:controller, :message, NOW(), NOW())`;
    await sequelize.query(SQL, {
      replacements: {
        date,
        ip,
        path,
        controller,
        message,
      },
      type: QueryTypes.INSERT,
    });
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};
export const createErrorLog = async (sequelize, req, err) => {
  try {
    debugger;
    const date = moment().toDate();
    const ip = req.socket.remoteAddress;
    const path = req.path ? req.path : "";
    const userName = req.user ? req.user.user_name : "";
    const SQL = `INSERT INTO log_errors (date, ip, path, err,user_name ,createdAt, updatedAt)
					 VALUES (:date, :ip, :path, :err,:userName, NOW(), NOW())`;
    console.log("SQL createErrorLog", SQL);
    await sequelize.query(SQL, {
      replacements: {
        date,
        ip,
        path,
        err,
        userName,
      },
      type: QueryTypes.INSERT,
    });
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};
