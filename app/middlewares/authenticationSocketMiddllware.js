import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { getTokenFromBearer } from "../utils/authenticationUtils.js";

const authenticationSocket = (socket, next) => {
  // Extract token from the socket handshake query
  const token1 = socket.handshake.auth.token;
  const accessToken = socket.handshake.headers['access-token'];


  if (!accessToken) {
    return next(new Error("A token is required for authentication"));
  }

  try {
    const token = getTokenFromBearer(accessToken);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    socket.user = {
      userName: decoded.user_name,
    };


    next();
  } catch (err) {
    // Handle token verification errors
    next(new Error("Invalid authentication token"));
  }
};

export default authenticationSocket;
