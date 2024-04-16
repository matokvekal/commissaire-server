import jwt from "jsonwebtoken";
import { getTokenFromRequest } from "../utils/authenticationUtils.js";
import config from "../config/index.js";
//import { isBefore } from "date-fns";

const bypassPathsWhiteList = new Set([
  "/parent/auth/login",
  "/kid/register",
  "/kid/auth/confirmCode",
  "/parent/auth/confirmCode",
  "/kid/sayhi",
  "/parent/sayhi",
  "/kid/simulatejwttoken",
  "/parent/register",
  "/parent/confirm",
  "/parent/reset",
]);

const isPathCanBypass = (path) => bypassPathsWhiteList.has(path);

const authenticationMiddleware = (db) => async (req, res, next) => {
  console.log("at authenticationMiddleware");
  console.log(req.path);
  if (isPathCanBypass(req.path)) {
    return next();
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    //TODO
    // Implement getUserDataFromDB to fetch user details from the database.

    const { isValidUser, userName, userId } = await getUserDataFromDB(
      decoded.userName
    );
    if (!isValidUser) {
      return res.status(401).send("User not valid");
    }

    req.user = { userName, userId };
    next();
  } catch (err) {
    return res.status(401).send("Invalid authentication token");
  }
};

//use moment utc to compare dates not use. jwt do it automatically
//const checkIfTokenExpired = (tokenExpireDate) => isBefore(new Date(tokenExpireDate), new Date());

const getUserDataFromDB = async (userName) => {
  // Database logic here
  return { isValidUser: true, userName: "test", userId: 1 };
};

export default authenticationMiddleware;
