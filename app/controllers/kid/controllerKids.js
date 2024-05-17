import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import config from "../../config/index.js";
import jwt from "jsonwebtoken";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import Wlogger from "../../utils/winstonLogger.js";
import { ServerNumbers } from "../../constants/serverConstants.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";
// import emitMessageToAllClients from "../../utils/socketEmitterUtil.js";
class ControllerKids extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }
  //TODO
  // ADD table kids defaults with  basic default, avarage , so when create new kids he will get default by his age countru etc

  //post /api/kid/device
  //get user_id,device_type_id ,recive the kid_device_id

  registerDevice = async (req, res) => {
    console.log(" at registerDevice");
    try {
      const kidId = req.user.userId;
      let deviceTypeId = req.body.deviceTypeId;
      let serial = req.body.serial;
      let deviceName = req.body.deviceName;
      const email = req.user.userName;

      if (!kidId || !deviceTypeId || !serial) {
        return res.status(400).send("some data is missing");
      }
      deviceTypeId = getFixedValue(deviceTypeId);
      serial = getFixedValue(serial);
      deviceName = getFixedValue(deviceName);

      let SQL =
        "select * from kid_devices where  device_type_id = :deviceTypeId and kid_id = :kidId and is_active=1";
      const device = await this.sequelize.query(SQL, {
        replacements: { serial, deviceTypeId, kidId },
        type: QueryTypes.SELECT,
      });
      if (device.length > 0) {
        return res.status(400).send("device already registered");
      } else {
        SQL =
          "insert into kid_devices (kid_id,device_type_id,serial,device_name) values (:kidId,:deviceTypeId,:serial,:deviceName)";
        const result = await this.sequelize.query(SQL, {
          replacements: { kidId, deviceTypeId, serial, deviceName },
          type: QueryTypes.INSERT,
        });
        const kidDeviceId = result[0]; //get the id of the kid device

        const token = createJwtToken(email,userType);
        res.setHeader("Authorization", `Bearer ${token}`);
        return res.status(200).send({ kidDeviceId });
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
    console.log(" at kidApps");
    try {
      const kidId = req.user.userId;
      const userName = req.user.userName;
      const deviceId = req.body.kidDeviceId;

      const apps = req.body.apps;

      if (!apps || !userName || !deviceId) {
        return res.status(400).send("some data is missing");
      }
      let SQL =
        "select * from kid_devices where id = :deviceId and kid_id = :kidId and is_active=1";
      const device = await this.sequelize.query(SQL, {
        replacements: { deviceId, kidId },
        type: QueryTypes.SELECT,
      });
      if (device.length == 0) {
        return res.status(400).send("device not found");
      }
      //convert the apps to app_list=  arry of packagNames
      const list = apps.map((app) => app.packageName);
      if (list.length == 0) {
        return res.status(400).send("apps list is empty");
      }
      const app_list = list.join(",");

      if (app_list.length > ServerNumbers.max_devices_amount) {
        return res.status(400).send("apps list is too long");
      }
      //cal procedure handle_kid_new_apps aith app_list,kidId,kidDeviceId,deviceTypeId;
      SQL = "call handle_kid_new_apps(:app_list,:kidId,:deviceId)";
      const results = await this.sequelize.query(SQL, {
        replacements: { app_list, kidId, deviceId },
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

  //Get /api/kid/apps   kp-32
  //kid app will get list of apps with theres status, also  devideid from the query string
  //kid will send at request the device id
  //this api will cal at login or at any time the kid will get notification
  //app status : (block, always, reduce, cumulate, allow)
  getApps = async (req, res) => {
    console.log(" at getApps");
    try {
      const kidId = req.user.userId;
      const deviceId = req.query.deviceid;
      if (!kidId || !deviceId) {
        return res.status(400).send("some data is missing");
      }

      let SQL =
        "select id,status,app_id from kid_apps where kid_id=:kidId and  kid_device_id = :deviceId and is_active=1 and is_exist=1";
      const apps = await this.sequelize.query(SQL, {
        replacements: { kidId, deviceId },
        type: QueryTypes.SELECT,
      });
      return res.status(200).send({ apps });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getApps.",
      });
    }
  };

  //Get /api/kids/limits     kp-43
  //kid will get  startDayTime,endDayTime per ech day, and ratio,
  //this api will cal at login or at any time the kid will get notification
  limits = async (req, res) => {
    console.log("at limits");
    const code = "default-9";
    try {
      const age = 11; // TODO: get the age from the kid data
      const kidId = req.user.userId;

      if (!kidId) {
        return res.status(400).send("Some data is missing");
      }

      // Call stored procedure to handle kid limits
      const SQL = `CALL handle_kid_limits(:kidId, :code)`;
      const replacements = { kidId, code };
      const results = await this.sequelize.query(SQL, {
        replacements,
        type: QueryTypes.SELECT,
      });

      // Since the query returns multiple result sets, we need to get the actual data from the first result set
      const limits = results[1][0];

      return res.status(200).send({limits});
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in limits.",
      });
    }
  };

  // limits = async (req, res) => {
  //   console.log("at limits");
  //   try {
  //     const age = 11; // TODO: get the age from the kid data
  //     const kidId = req.user.userId;

  //     if (!kidId) {
  //       return res.status(400).send("Some data is missing");
  //     }

  //     let SQL = `
  //       SELECT id, ratio, sun_start, sun_end, mon_start, mon_end, tue_start, tue_end, wed_start, wed_end, thu_start, thu_end, fri_start, fri_end, sat_start, sat_end
  //       FROM kids
  //       WHERE kid_id = :kidId AND is_active = 1
  //     `;
  //     let limits = await this.sequelize.query(SQL, {
  //       replacements: { kidId },
  //       type: QueryTypes.SELECT,
  //     });

  //     if (limits.length === 0) {
  //       // Insert into kids table if no data exists for this kid
  //       SQL = `
  //         INSERT INTO kids (kid_id, age, ratio, sun_start, sun_end, mon_start, mon_end, tue_start, tue_end, wed_start, wed_end, thu_start, thu_end, fri_start, fri_end, sat_start, sat_end, updateAt)
  //         SELECT :kidId,
  //                :age,
  //                kld.ratio,
  //                kld.sun_start,
  //                kld.sun_end,
  //                kld.mon_start,
  //                kld.mon_end,
  //                kld.tue_start,
  //                kld.tue_end,
  //                kld.wed_start,
  //                kld.wed_end,
  //                kld.thu_start,
  //                kld.thu_end,
  //                kld.fri_start,
  //                kld.fri_end,
  //                kld.sat_start,
  //                kld.sat_end,
  //                NOW()
  //         FROM kid_limits_data kld
  //         WHERE kld.age_from <= :age
  //           AND kld.age_to >= :age
  //           AND kld.code = 'default'
  //         ON DUPLICATE KEY UPDATE updateAt = NOW();
  //       `;
  //       await this.sequelize.query(SQL, {
  //         replacements: { kidId, age },
  //         type: QueryTypes.INSERT,
  //       });

  //       // Select the limits again after insertion
  //       SQL = `
  //         SELECT id, ratio, sun_start, sun_end, mon_start, mon_end, tue_start, tue_end, wed_start, wed_end, thu_start, thu_end, fri_start, fri_end, sat_start, sat_end
  //         FROM kids
  //         WHERE kid_id = :kidId AND is_active = 1
  //       `;
  //       limits = await this.sequelize.query(SQL, {
  //         replacements: { kidId },
  //         type: QueryTypes.SELECT,
  //       });
  //     }

  //     return res.status(200).send(limits);
  //   } catch (err) {
  //     console.log(err);
  //     res.createErrorLogAndSend(this.sequelize, {
  //       err: err.message || "Some error occurred in limits.",
  //     });
  //   }
  // };

  //POST api/kid/usage   kp-34
  // the kid will send to the server every x minuts

  usage = async (req, res) => {
    console.log(" at usage");
    try {
      const { userId: kidId } = req.user;
      const {
        deviceId,
        dateTime,
        dailyTimeLimit,
        dailyTimeRemaining,
        playTimeRemaining,
        dailyTimeUsed,
        total_increment_apps,
        total_decremant_apps,
      } = req.body;

      // Ensure all required data is provided
      if (
        !kidId ||
        !deviceId ||
        !dateTime ||
        !dailyTimeLimit ||
        !dailyTimeRemaining ||
        !playTimeRemaining ||
        !dailyTimeUsed ||
        !total_increment_apps ||
        !total_decremant_apps
      ) {
        return res.status(400).send("Some data is missing");
      }

      // Use prepared statements for better security and performance
      const SQL = `
        INSERT INTO kid_usage
          (kid_id, deviceId, date_time, dailyTimeLimit, dailyTimeRemaining, playTimeRemaining, dailyTimeUsed, total_increment_apps, total_decremant_apps)
        VALUES
          (:kidId, :deviceId, :dateTime, :dailyTimeLimit, :dailyTimeRemaining, :playTimeRemaining, :dailyTimeUsed, :total_increment_apps, :total_decremant_apps)
      `;
      await this.sequelize.query(SQL, {
        replacements: {
          kidId,
          deviceId,
          dateTime,
          dailyTimeLimit,
          dailyTimeRemaining,
          playTimeRemaining,
          dailyTimeUsed,
          total_increment_apps,
          total_decremant_apps,
        },
        type: QueryTypes.INSERT,
      });

      return res.status(200).send("Data saved successfully");
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in usage.",
      });
    }
  };

  //POST api/kid/token
  //her the client will send the server the firebase token for push notificatin
  googleToken = async (req, res) => {
    console.log(" at googleToken");
    try {
      const kidId = req.user.userId;
      const token = req.body.token;
      if (!kidId || !token) {
        return res.status(400).send("some data is missing");
      }
      const SQL =
        "update users set firebase_notification_token = :token where id = :kidId";
      await this.sequelize.query(SQL, {
        replacements: { token, kidId },
        type: QueryTypes.UPDATE,
      });
      return res.status(200).send("Token saved successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in googleToken.",
      });
    }
  };

  // GET /api/kid/sayhi
  hello = async (req, res, io) => {
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
    console.log(" at kid simulateJwtToken");
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
