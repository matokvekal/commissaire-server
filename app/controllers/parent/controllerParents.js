import BaseController from "../kid/baseController.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";

class ControllerParents extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
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
