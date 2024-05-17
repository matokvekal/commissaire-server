import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { getTokenFromBearer } from "../utils/authenticationUtils.js";

const authenticationSocket = (socket, next) => {
  // Extract token from the socket handshake query
  const token1 = socket.handshake.auth.token;
  const accessToken = socket.handshake.headers["access-token"];

  if (!accessToken) {
    return next(new Error("A token is required for authentication"));
  }

  try {
    const token = getTokenFromBearer(accessToken);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    //add socket object the user_name and user_type from  jwt
    // socket.user = {
    //   userName: decoded.user_name,
    // };
    // socket.userType = {userType:decoded.user_type}
    //check if the token contain user_name and user_type
    if (!decoded.user_name || !decoded.user_type) {
      return next(new Error("Invalid authentication token"));
    }

    socket.user = {
      userName: decoded.user_name,
      userType: decoded.user_type,
    };

    // socket.user = {
    //   userName: decoded.user_name,
    // };
    // socket.userType = decoded.user_type;

    next();
  } catch (err) {
    // Handle token verification errors
    next(new Error("Invalid authentication token"));
  }
};

export default authenticationSocket;
