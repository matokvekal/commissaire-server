import BaseController from "../kid/baseController.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";

class ControllerParents extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

    //POST api/parent/token
//her the client will send the server the firebase token for push notificatin
googleToken = async (req, res) => {
  try {
    const parent_id = req.user.userId;
    const token = req.body.token;
    if (!parent_id || !token) {
      return res.status(400).send("some data is missing");
    }
    const SQL = "update users set firebase_notification_token = :token where id = :parent_id";
    await this.sequelize.query(SQL, {
      replacements: { token, parent_id },
      type: QueryTypes.UPDATE,
    });
    return res.status(200).send("Token saved successfully");
  } catch (err) {
    console.log(err);
    res.createErrorLogAndSend(this.sequelize, {
      err: err.message || "Some error occurred in saving token.",
    });
  }
}

  // GET /api/parent/sayhi
  hello = async (req, res) => {
    try {
      res.status(200).send("Hello from parents controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in hello parent.",
      });
    }
  };

}
export default ControllerParents;
