import BaseController from "./baseController.js";
import jwt from "jsonwebtoken";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
// const { QueryTypes } = require("sequelize");
// import { QueryOptionsWithType } from "sequelize";
//const { getFixedValue } = require("../utils/getFixedValues");
import { getFixedValue } from "../../utils/getFixedValues.js";

class ControllerKids extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }
  // GET /api/kid/sayhi
  hello = async (req, res) => {
    try {

      await createSingleLog(
        this.sequelize,
        req,
        "Hello from kids controller",
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

  // GET /api/kid/simulatejwttoken
  simulateJwtToken = async (req, res) => {
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
}
export default ControllerKids;
