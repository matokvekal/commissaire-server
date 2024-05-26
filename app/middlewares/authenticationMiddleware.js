import jwt from "jsonwebtoken";
import { getTokenFromRequest } from "../utils/authenticationUtils.js";
import config from "../config/index.js";
import { serverFlags } from "../constants/serverConstants.js";
import { QueryTypes } from "sequelize";
import { createSingleLog } from "../utils/apiLoggerUtils.js";
//import { isBefore } from "date-fns";

const bypassPathsWhiteList = new Set([
  "/kid/login",
  "/kid/register",
  "/kid/confirmcode",
  "/kid/simulatejwttoken",
  "/kid/sayhi",
  "/parent/login",
  "/parent/register",
  "/parent/confirm",
  "/parent/reset",
  "/parent/sayhi",
  "/parent/simulatejwttoken",
]);

const isPathCanBypass = (path) => bypassPathsWhiteList.has(path);

const authenticationMiddleware = (db) => async (req, res, next) => {
  console.log("at authenticationMiddleware");
  console.log(req.path);
  if (isPathCanBypass(req.path) || isPathCanBypass(req.originalUrl)) {
    return next();
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const userType = req.path.split("/")[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const { isValidUser, userName, userId, familyId } = await getUserDataFromDB(
      db.sequelize,
      decoded.user_name,
      userType
    );
    //log the data to db
    if (serverFlags.LOG_API) {
      const path = req.path;
      await createSingleLog(
        db.sequelize,
        req,
        `${userType} userName:${userName},userId:${userId},familyId:${familyId} isValidUser:${isValidUser}`,
        ""
      );
    }
    if (!isValidUser) {
      return res.status(401).send("User not valid");
    }

    req.user = { userName, userId, familyId };
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).send("Invalid authentication token");
    // res.createErrorLogAndSend(this.sequelize, {
    //   err: err.message || "Invalid authentication token",
    // });
  }
};

//use moment utc to compare dates not use. jwt do it automatically
//const checkIfTokenExpired = (tokenExpireDate) => isBefore(new Date(tokenExpireDate), new Date());

const getUserDataFromDB = async (sequelize, userName, userType) => {
  try {
    let SQL;
    if (userType === "parent") {
      SQL = `select * from users where  phone=:userName and is_active=1 and user_type='parent'`;
    } else if (userType === "kid") {
      SQL = `select * from users where  email=:userName and is_active=1 and user_type='kid'`;
    } else {
      return { isValidUser: false, userName: "", userId: 0 };
    }
    const user = await sequelize.query(SQL, {
      replacements: { userName },
      type: QueryTypes.SELECT,
    });

    return {
      isValidUser: true,
      userName: user[0].email,
      userId: user[0].id,
      familyId: user[0].family_id,
    };
  } catch (err) {
    return { isValidUser: false, userName: "", userId: 0 };
  }
};

export default authenticationMiddleware;
