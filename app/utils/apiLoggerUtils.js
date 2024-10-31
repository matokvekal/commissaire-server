import moment from "moment";
import config from "../config/index.js";
import { QueryTypes } from "sequelize";

export const createSingleLog = async (
  user_name = null,
  sequelize,
  req,
  message,
  controller,
  data = null
) => {
  try {
    const date = moment().toDate();
    const ip = req ? req.socket.remoteAddress : "";
    const path = req ? req.path : "";
    controller = controller ? controller : path;
    const SQL = `INSERT INTO logs (user_name,date, ip, path,controler, message, createdAt,data )
					 VALUES (:user_name,:date, :ip, :path,:controller, :message, NOW(), :data)`;
    await sequelize.query(SQL, {
      replacements: {
        date,
        ip,
        path,
        controller,
        message,
        data,
        user_name,
      },
      type: QueryTypes.INSERT,
    });
  } catch (err) {
    console.error("Error in createSingleLog:", err);
  }
};
export const createErrorLog = async (sequelize, req, err) => {
  try {
    const date = moment().toDate();
    const ip = req.socket.remoteAddress;
    const path = req.path ? req.path : "";
    const userName = req.user ? req.user.userName : "";
    const SQL = `INSERT INTO log_errors (date, ip, path, err,user_name )
					 VALUES (:date, :ip, :path, :err,:userName)`;
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
    console.error("Error in createErrorLog:", err);
  }
};
