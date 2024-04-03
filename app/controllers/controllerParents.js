import BaseController from "./baseController.js";
// const { QueryTypes } = require("sequelize");
// const { getFixedValue } = require("../utils/getFixedValues");
import { getFixedValue } from "../utils/getFixedValues.js";

class ControllerParents extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }
  // GET /api/parents/sayhi
  hello = async (req, res) => {
    try {
      res.status(200).send("Hello from parents controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend({
        err: err.message || "Some error occurred in getTypes.",
      });
    }
  };
}
export default ControllerParents;
