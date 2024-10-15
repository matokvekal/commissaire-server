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

  //controler to simulate kids
  // GET /api/temp/add_kid this will add kid to parent
  // GET /api/temp/delete_kid this will delete kid from parent
  //use procidure

  //1.add kid to users table and get the id
  //2.add kid to daily_schedule
  //3 add data to kid_apps table
  //add data to kid_devices table

  //Get /api/temp/add_kid/0542288530
  addKid = async (req, res) => {
    console.log(" at addKid");
    try {
      //get the phone from the url /api/temp/add_kid?phone=0542288530
      const phone = req.query.phone;
      if (!phone || phone.length !== 10) {
        return res.status(400).send("Some error occurred in adding kid.");
      }
      await this.sequelize.query(`CALL add_kid(:phone)`, {
        replacements: {
          phone,
        },
        type: QueryTypes.INSERT,
      });
      return res.status(200).send("kid added");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in adding kid.",
      });
    }
  };

  //Get /api/temp/delete_kid?phone=0542288530
  deleteKid = async (req, res) => {
    console.log(" at deleteKid");
    try {
      const phone = req.query.phone;
      if (!phone || phone.length !== 10) {
        return res.status(400).send("Some error occurred in adding kid.");
      }

      await this.sequelize.query(
        `delete from users where id = (select id from (select id from users where family_id = (select family_id from users where user_type = "parent" and phone = :phone) and user_type = "kid" and is_active = 1 order by id desc limit 1) as temp_table)`,
        {
          replacements: {
            phone,
          },
          type: QueryTypes.DELETE,
        }
      );
      return res.status(200).send("kid deleted");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in deleting kid.",
      });
    }
  };
}
export default tempController;
