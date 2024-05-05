import Logger from "../utils/logger.js";
import authenticationSocket from "../middlewares/authenticationSocketMiddllware.js";

const userSocketMap = {};
export default function initializeSocketHandlers(io) {

  
  io.use((socket, next) => {
    // Verify the token using the authentication middleware
    authenticationSocket(socket, next);
  });

  
io.on("connection", (socket) => {
    Logger.debug("A user connected to WebSocket");
    const userId = socket.user.userName;
    userSocketMap[userId] = socket.id;
    console.log(userSocketMap)

    socket.on("message", (msg) => {
      Logger.debug("Received chat message:", msg);
      console.log("Received chat socket.user.userName:", socket.user.userName);
      // Broadcast the message to all connected clients
      // io.emit("chat message", msg);
      sendMessageToUser(socket.user.userName, "Hello from server2")
    });

    // Handle disconnection events
    socket.on("disconnect", () => {
      Logger.debug("A user disconnected from WebSocket");
      delete userSocketMap[userId];
    });
  });

  function sendMessageToUser(userId, message) {
    const socketId = userSocketMap[userId];
    if (socketId) {
      io.to(socketId).emit("private message", message);
    } else {
      Logger.debug(`User with ID ${userId} is not connected`);
    }
  }
}
