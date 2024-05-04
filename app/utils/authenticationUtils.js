import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import moment from "moment";
import config from "../config/index.js";
export const getTokenFromRequest = (req) => {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const [, token] = bearerHeader.split(" ");
    return token;
  }
  return null;
};

// export const getDataFromGoogleToken = async (googleToken) => {
//   const response = await fetch(
//     `https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`
//   );
//   const data = await response.json();
//   return data;
// };

export const createOTP = () => {
  const min = 1000;
  const max = 9999;
  const confirmationCode = Math.floor(Math.random() * (max - min + 1)) + min;
  return confirmationCode;
};

//export const generateJwtToken = (payload) => {
// const token = jwt.sign(payload, config.TOKEN_KEY, {
//   expiresIn: `${config.tokenExpireDayLimit}d`,
//});
// return token;
//};

export const createJwtToken = (userName) => {
  const token = jwt.sign(
    { user_name: userName, last_login: moment() },
    config.JWT_SECRET,
    {
      expiresIn: `${config.tokenExpireDayLimit}d`,
    }
  );
  return token;
};
// export const getModeFromEnv = () => {
//   debugger
//   console.log("getModeFromEnv", process.env.MODE);
//   return process.env.MODE || "staging";
// };
