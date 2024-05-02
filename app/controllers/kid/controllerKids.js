import BaseController from "./baseController.js";
import jwt from "jsonwebtoken";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import Wlogger from "../../utils/winstonLogger.js";
import { ServerNumbers } from "../../constants/serverConstants.js";
import { getFixedValue } from "../../utils/getFixedValues.js";

class ControllerKids extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  //post /api/kid/device
  //get user_id,device_type_id ,recive the kid_device_id

  registerDevice = async (req, res) => {
    try {
      const kidId = req.user.userId;
      let deviceTypeId = req.body.deviceTypeId;
      let serial = req.body.serial;
      let deviceName = req.body.deviceName;

      if (!kidId || !deviceTypeId || !serial) {
        return res.status(400).send("some data is missing");
      }
      deviceTypeId = getFixedValue(deviceTypeId);
      serial = getFixedValue(serial);
      deviceName = getFixedValue(deviceName);

      let SQL =
        "select * from kid_devices where serial = :serial and device_type_id = :deviceTypeId and kid_id = :kidId and is_active=1";
      const device = await this.sequelize.query(SQL, {
        replacements: { serial, deviceTypeId, kidId },
        type: QueryTypes.SELECT,
      });
      if (device.length > 0) {
        return res.status(400).send("device already registered");
      } else {
        SQL =
          "insert into kid_devices (kid_id,device_type_id,serial,device_name) values (:kidId,:deviceTypeId,:serial,:deviceName)";
        await this.sequelize.query(SQL, {
          replacements: { kidId, deviceTypeId, serial, deviceName },
          type: QueryTypes.INSERT,
        });
        const token = createJwtToken(kid.email);
        res.setHeader("Authorization", `Bearer ${token}`);
        return res.status(200).send("Device registered successfully");
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in registerDevice.",
      });
    }
  };

  //Post /api/kid/apps
  kidApps = async (req, res) => {
    try {
      const kidId = req.user.userId;
      const userName = req.user.userName;
      const deviceId = req.body.deviceId;

      const apps = req.body.apps;

      if (!apps || !userName || !userId || !deviceId) {
        return res.status(400).send("some data is missing");
      }
      //convert the apps to app_list=  arry of packagNames
      const app_list = apps.map((app) => app.packageName);
      if (app_list.length == 0) {
        return res.status(400).send("apps list is empty");
      }

      if (app_list.length > ServerNumbers.max_devices_amount) {
        return res.status(400).send("apps list is too long");
      }
      //cal procedure handle_kid_new_apps aith app_list,kidId,kidDeviceId,deviceTypeId;
      const SQL =
        "call handle_kid_new_apps(:app_list,:kidId,:deviceId,:deviceTypeId)";
      const results = await this.sequelize.query(SQL, {
        replacements: { app_list, kidId, deviceId, deviceTypeId },
        type: QueryTypes.SELECT,
      });
      if (results[0].length > 0) {
        return res.status(400).send("Some apps are not valid");
      }
      return res.status(200).send("Apps saved successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in kidApps.",
      });
    }
  };

  // GET /api/kid/sayhi
  hello = async (req, res) => {
    try {
      Wlogger.log("info", "kid sey hello", "test1");
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
