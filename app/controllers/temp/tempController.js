import BaseController from "../parent/baseController.js";
// import { getFixedValue } from "../../utils/getFixedValues.js";
// import config from "../../config/index.js";
import Wlogger from "../../utils/winstonLogger.js";
import { QueryTypes } from "sequelize";
// import checkType from "../../utils/checkType.js";
// import { allowedFields } from "../../constants/serverConstants.js";
// import SocketManager from "../../handlers/websocketHandler.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";

class tempController extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  // GET /api/temp/log?data=
  log = async (req, res) => {
    try {
      const data = req.query.data;
      console.log(" at log data:", data);
      res.status(200).send("Hello from temp/log controller");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello parent."
      });
    }
  };

  // GET /api/temp/hello2
  hello2 = async (req, res, io) => {
    try {
      Wlogger.log("info", "temp sey hello2", "test1");
      await createSingleLog(
        "temp/hello2",
        this.sequelize,
        req,
        "Hello from hello2 controller",
        "/hello"
      );
      res.status(200).send("Hello from kids controller");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello."
      });
    }
  };

  // GET /api/temp/token?id=id  working
  simulateJwtToken = async (req, res) => {
    const id = req.query.id;
    console.log(" at get temp simulateJwtToken id:", id);
    try {
      let SQL = `select * from users where id = :id`;
      const user = await this.sequelize.query(SQL, {
        replacements: { id },
        type: QueryTypes.SELECT
      });
      if (user.length === 0) {
        return res.status(400).send("User not found");
      }
      const kid = user[0];
      const token = createJwtToken(kid.email, "kid");
      SQL = "insert into demo_tokens (user_id,token) values (:user_id,:token)";
      await this.sequelize.query(SQL, {
        replacements: { user_id: id, token },
        type: QueryTypes.INSERT
      });
      res.status(200).send(token);
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in simulateJwtToken."
      });
    }
  };

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
          phone
        },
        type: QueryTypes.INSERT
      });
      return res.status(200).send("kid added");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in adding kid."
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
            phone
          },
          type: QueryTypes.DELETE
        }
      );
      return res.status(200).send("kid deleted");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in deleting kid."
      });
    }
  };
}
export default tempController;
