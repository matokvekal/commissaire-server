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
  //very simple get api  /api/temp/resetavi  to delete user  with phone 0548047997 from the database from table users and table family
  resetavi = async (req, res) => {
    try {
      console.log("at resetavi");
      const phone = "0548047997";
      let SQL = `DELETE FROM users WHERE phone = :phone AND user_type = "parent"`;
      await this.sequelize.query(SQL, {
        replacements: { phone },
        type: QueryTypes.DELETE,
      });
      SQL = `DELETE FROM family WHERE parent_phone = :phone`;
      await this.sequelize.query(SQL, {
        replacements: { phone },
        type: QueryTypes.DELETE,
      });
      return res.status(200).send("User deleted successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };
  //very simple get api  /api/temp/resetomri  to delete user  with email omribr4443@gmail.com from the database from table users and table family
  resetomri = async (req, res) => {
    console.log("at resetomri");
    try {
      const email = "omribr4443@gmail.com";

      let SQL = `SELECT id FROM users WHERE email = :email AND user_type = "kid"`;
      const [results] = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });

      if (results.length === 0) {
        return res.status(404).send("User not found");
      }

      const kidId = results.id;

      SQL = `DELETE FROM users WHERE email = :email AND user_type = "kid"`;
      await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.DELETE,
      });

      SQL = `DELETE FROM kids WHERE kid_id = :kidId`;
      await this.sequelize.query(SQL, {
        replacements: { kidId },
        type: QueryTypes.DELETE,
      });

      SQL = `DELETE FROM kid_devices WHERE kid_id = :kidId`;
      await this.sequelize.query(SQL, {
        replacements: { kidId },
        type: QueryTypes.DELETE,
      });

      SQL = `DELETE FROM kid_apps WHERE kid_id = :kidId`;
      await this.sequelize.query(SQL, {
        replacements: { kidId },
        type: QueryTypes.DELETE,
      });

      return res
        .status(200)
        .send({ message: "User deleted successfully", kidId });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };
  // api/temp/conectavioldkids : This endpoint updates the family_id of all kids in users table with last name Kaufman, from an old family id to a new family id    
  conectavioldkids = async (req, res) => {
    try {
      console.log("Connect old Avi's children to the new Avi family");
      const { oldFamilyId, newFamilyId } = req.body;

      if (!(oldFamilyId && newFamilyId)) {
        console.log("Failed: some details are missing");
        return res
          .status(400)
          .send("Missing details: required oldFamilyId and newFamilyId");
      }

      const SQL = `UPDATE users SET family_id = :newFamilyId WHERE family_id = :oldFamilyId AND user_type = 'kid' AND l_name = 'Kaufman'`;
      await this.sequelize.query(SQL, {
        replacements: { newFamilyId, oldFamilyId },
        type: QueryTypes.UPDATE,
      });

      return res.status(200).send("Updated kids' family successfully.");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };
}
export default tempController;
