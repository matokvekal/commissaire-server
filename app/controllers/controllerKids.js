import BaseController from "./baseController.js";
// const { QueryTypes } = require("sequelize");
// import { QueryOptionsWithType } from "sequelize";
//const { getFixedValue } = require("../utils/getFixedValues");
import { getFixedValue } from "../utils/getFixedValues.js";

class ControllerKids extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }
  // GET /api/kids/sayhi
  hello = async (req, res) => {
    try {
      res.status(200).send("Hello from kids controller");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend({
        err: err.message || "Some error occurred in getTypes.",
      });
    }
  };
}
export default ControllerKids;
