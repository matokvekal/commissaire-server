import Logger from "../utils/logger.js";
import authenticationSocket from "../middlewares/authenticationSocketMiddlware.js";
import { createSingleLog } from "../utils/apiLoggerUtils.js";
import { QueryTypes } from "sequelize";

class SocketManager {
  constructor() {
    if (!SocketManager.instance) {
      this.userSocketMap = {};
      SocketManager.instance = this;
    }
    return SocketManager.instance;
  }

  initialize(io, db) {
    this.io = io;
    this.db = db;

    io.use((socket, next) => {
      authenticationSocket(socket, next);
    });

    io.on("connection", async (socket) => {
      const userName = socket.user.userName;
      const userType = socket.user.userType;
      const socketId = socket.id;
      await createSingleLog(
        userName,
        db.sequelize,
        "",
        `socket connected userName:${userName}-${userType}`,
        ""
      );
      let userId;
      Logger.debug(
        ` A user connected to WebSocket ${userId} ${userType} ${socketId}`
      );

      let SQL;
      let replacements;

      SQL = `select id from users where email=:userName and is_active=1 and is_register=1 and user_type=:userType`;
      replacements = { userName, userType };
      const result = await db.sequelize.query(SQL, {
        replacements,
        type: QueryTypes.SELECT,
      });
      if (result.length === 0) {
        throw new Error("User not found or does not meet criteria");
      }
      userId = result[0].id;

      this.setUserSocketId(userId, socketId);

      SQL = `
          UPDATE users 
          SET socket_id = :socketId, socket_updated = NOW() 
          WHERE id = :userId AND is_active = 1 AND is_register = 1 `;
      replacements = { socketId, userId };

      if (SQL && replacements) {
        await db.sequelize.query(SQL, {
          replacements,
          type: QueryTypes.UPDATE,
        });
      }

      socket.on("message", async (msg) => {
        Logger.debug("Received chat message:", msg);
        await createSingleLog(
          socket.user.userName,
          db.sequelize,
          "",
          `Received chat message`,
          msg ? JSON.stringify(msg) : ""
        );
        console.log(
          "Received chat socket.user.userName:",
          socket.user.userName
        );
      });

      socket.on("disconnect", async () => {
        Logger.debug("A user disconnected from WebSocket");
        this.removeUserSocketId(userId); // Remove from in-memory map
        SQL = ` UPDATE users   SET socket_id = NULL  WHERE id = :userId `;
        if (SQL && replacements) {
          await db.sequelize.query(SQL, {
            replacements: { userId },
            type: QueryTypes.UPDATE,
          });
        }
      });
    });
  }

  getUserSocketId(userId) {
    return this.userSocketMap[userId];
  }

  setUserSocketId(userId, socketId) {
    this.userSocketMap[userId] = socketId;
  }

  removeUserSocketId(userId) {
    delete this.userSocketMap[userId];
    console.log("removeUserSocketId", userId);
    const SQL = ` UPDATE users SET socket_id = NULL WHERE id = :userId`;
    this.db.sequelize.query(SQL, {
      replacements: { userId },
      type: QueryTypes.UPDATE,
    });
  }

  async sendMessageToUser(userId, message) {
    const socketId = this.getUserSocketId(userId);
    if (socketId) {
      this.io.to(socketId).emit("private message", message);
    } else {
      // Fallback to database lookup if not found in map
      const result = await this.db.sequelize.query(
        `SELECT socket_id FROM users WHERE id = :userId`,
        {
          replacements: { userId },
          type: QueryTypes.SELECT,
        }
      );
      if (result.length > 0 && result[0].socket_id) {
        this.io.to(result[0].socket_id).emit("private message", message);
      } else {
        Logger.debug(`User with ID ${userId} is not connected`);
        
      }
    }
  }
}

const instance = new SocketManager();
export default instance;
