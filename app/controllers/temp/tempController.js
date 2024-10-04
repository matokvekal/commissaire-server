import BaseController from "../parent/baseController.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import Wlogger from "../../utils/winstonLogger.js";
import { QueryTypes } from "sequelize";
import checkType from "../../utils/checkType.js";
import { allowedFields } from "../../constants/serverConstants.js";
import SocketManager from "../../handlers/websocketHandler.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";

class tempController extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  // GET /api/temp/hello1
  hello1 = async (req, res) => {
    try {
      res.status(200).send("Hello from hello1 controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello parent.",
      });
    }
  };

  // GET /api/temp/hello2
  hello2 = async (req, res, io) => {
    try {
      Wlogger.log("info", "temp sey hello2", "test1");
      await createSingleLog(
        this.sequelize,
        req,
        "Hello from hello2 controller",
        "/hello"
      );
      res.status(200).send("Hello from kids controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello.",
      });
    }
  };

  // GET /api/temp/simulatejwttoken
  simulateJwtToken = async (req, res) => {
    console.log(" at get temp simulateJwtToken");
    try {
      const token = jwt.sign({ id: 1 }, "mysecretkey", { expiresIn: "1h" });
      res.status(200).send(token);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in simulateJwtToken.",
      });
    }
  };

  //post /api/temp/simulattoken
  simulatejwttoken = async (req, res) => {
    try {
      console.log("at post temp  simulatejwttoken controller");
      const { email, userType, code } = req.body;
      if (!email || !userType) {
        return res.status(400).send(ServerErrors.GENERAL_ERROR);
      }
      if (code !== "giladdolev123") {
        return res.status(400).send(ServerErrors.GENERAL_ERROR);
      }
      const token = createJwtToken(email, userType);
      return res.status(200).send(token);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };



}
export default tempController;
