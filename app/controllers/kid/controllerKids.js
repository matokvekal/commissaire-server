import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import config from "../../config/index.js";
import jwt from "jsonwebtoken";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import Wlogger from "../../utils/winstonLogger.js";
import { ServerNumbers } from "../../constants/serverConstants.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";
import isValidLocation from "../../utils/locationValidator.js";
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
      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `GET/kids/registerDevice deviceTypeId:${deviceTypeId}`
      );
      if (!kidId || !deviceTypeId || !serial) {
        return res.status(400).send("some data is missing");
      }
      deviceTypeId = getFixedValue(deviceTypeId);
      serial = getFixedValue(serial);
      deviceName = getFixedValue(deviceName);

      let SQL =
        "select * from kid_devices where  device_type_id = :deviceTypeId and kid_id = :kidId and is_active=1 and serial = :serial";
      const device = await this.sequelize.query(SQL, {
        replacements: { serial, deviceTypeId, kidId },
        type: QueryTypes.SELECT,
      });
      if (device.length > 0) {
        const kidDeviceId = device[0].id;
        return res.status(200).send({ device_id: kidDeviceId });
      } else {
        SQL =
          "insert into kid_devices (kid_id,device_type_id,serial,device_name) values (:kidId,:deviceTypeId,:serial,:deviceName)";
        const result = await this.sequelize.query(SQL, {
          replacements: { kidId, deviceTypeId, serial, deviceName },
          type: QueryTypes.INSERT,
        });
        const device_id = result[0]; //get the id of the kid device

        // const token = createJwtToken(email, userType);
        // res.setHeader("Authorization", `Bearer ${token}`);
        return res.status(200).send({ device_id });
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
      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `Post/kids/apps`
      );
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
      if (list.length > ServerNumbers.max_devices_amount) {
        return res.status(400).send("apps list is too long");
      }
      const app_list = list.join(",");

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
  //POST /api/kid/appusage
  appUsage = async (req, res) => {
    console.log("at appusage");
    try {
      const kidId = req.user.userId;
      const userName = req.user.userName;
      const deviceId = req.body.deviceId;
      const appUsage = req.body.appUsage;

      await createSingleLog(
        this.sequelize, // Use Sequelize instance here
        req,
        `kidId:${kidId}`,
        `Post/kids/appusage`
      );

      if (!appUsage || !userName || !deviceId) {
        return res.status(400).send("Some data is missing");
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
      // Prepare data for bulk insertion
      const list = appUsage.map((app) => ({
        kidId: kidId,
        deviceId: deviceId,
        packageName: app.packageName,
        startDate: app.startDate,
        endDate: app.endDate,
        appId: app.appId,
        appType: app.appType,
        uploadAt: app.uploadAt,
      }));

      if (list.length === 0) {
        return res.status(400).send("App usage list is empty");
      }

      const KidAppUsage = KidAppUsageModel(this.sequelize);

      // Bulk insert data using Sequelize
      const chunkSize = 100; // Adjust this value based on performance testing
      for (let i = 0; i < list.length; i += chunkSize) {
        const chunk = list.slice(i, i + chunkSize);

        await KidAppUsage.bulkCreate(chunk, {
          updateOnDuplicate: [
            "package_name",
            "start_date",
            "end_date",
            "appId",
            "app_type",
            "upload_at",
          ],
        });
      }

      return res.status(200).send("App usage saved successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in appUsage.",
      });
    }
  };
  //POST api/kid/position
  position = async (req, res) => {
    console.log("at position");
    try {
      const { userId: kidId } = req.user;
      const { deviceId, dateTime, latitude, longitude } = req.body;

      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `POST/kids/position dateTime:${dateTime},latitude:${latitude},longitude:${longitude}`
      );

      // Ensure all required data is provided
      if (!kidId || !deviceId || !dateTime || !latitude || !longitude) {
        return res.status(400).send("Some data is missing");
      }
      if (!isValidLocation(parseFloat(latitude), parseFloat(longitude))) {
        return res.status(400).send("Invalid latitude or longitude values");
      }
      // Insert location data into the 'location' table
      let insertSQL = `
        INSERT INTO location
          (kid_id, device_id, user_time, longitude, latitude)
        VALUES
          (:kidId, :deviceId, :dateTime, :longitude, :latitude)
      `;
      await this.sequelize.query(insertSQL, {
        replacements: {
          kidId,
          deviceId,
          dateTime,
          longitude,
          latitude,
        },
        type: this.sequelize.QueryTypes.INSERT,
      });

      // Update the 'users' table with the new location values
      let updateSQL = `
        UPDATE users
        SET locationX = :longitude, locationY = :latitude
        WHERE id = :kidId 
         AND (locationX != :longitude OR locationY != :latitude)
      `;
      await this.sequelize.query(updateSQL, {
        replacements: {
          kidId,
          longitude,
          latitude,
        },
        type: this.sequelize.QueryTypes.UPDATE,
      });

      return res.status(200).send({
        message: "Data saved successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred in position.",
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
      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `Get/kids/apps`
      );
      if (!kidId || !deviceId) {
        return res.status(400).send("some data is missing");
      }

      let SQL = `select ka.id,ka.status,ka.app_id,ap.package_name from kid_apps ka 
        left join apps ap on ka.app_id = ap.id
        where ka.kid_id=:kidId and  ka.kid_device_id = :deviceId and ka.is_active=1 and ka.is_exist=1
        `;
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
      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        "GET/kids/limits "
      );
      // Call stored procedure to handle kid limits
      const SQL = `CALL handle_kid_limits(:kidId, :code)`;
      const replacements = { kidId, code };
      const results = await this.sequelize.query(SQL, {
        replacements,
        type: QueryTypes.SELECT,
      });

      // Since the query returns multiple result sets, we need to get the actual data from the first result set
      const limits = results[1][0];

      return res.status(200).send({ limits });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in limits.",
      });
    }
  };

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
        totalIncrementApps,
        totalDecrementApps,
      } = req.body;
      await createSingleLog(
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `POST/kids/usage dateTime:${dateTime},dailyTimeLimit: ${dailyTimeLimit},dailyTimeRemaining:${dailyTimeRemaining},playTimeRemaining:${playTimeRemaining}`
      );
      // Ensure all required data is provided
      if (
        !kidId ||
        !deviceId ||
        !dateTime ||
        !dailyTimeLimit ||
        !dailyTimeRemaining ||
        !playTimeRemaining ||
        !dailyTimeUsed ||
        !totalIncrementApps ||
        !totalDecrementApps
      ) {
        return res.status(400).send("Some data is missing");
      }
      let insertSQL = `
        INSERT INTO kid_usage
          (kid_id, deviceId, date_time, dailyTimeLimit, dailyTimeRemaining, playTimeRemaining, dailyTimeUsed, total_increment_apps, total_decrement_apps)
        VALUES
          (:kidId, :deviceId, :dateTime, :dailyTimeLimit, :dailyTimeRemaining, :playTimeRemaining, :dailyTimeUsed, :totalIncrementApps, :totalDecrementApps)
      `;
      await this.sequelize.query(insertSQL, {
        replacements: {
          kidId,
          deviceId,
          dateTime,
          dailyTimeLimit,
          dailyTimeRemaining,
          playTimeRemaining,
          dailyTimeUsed,
          totalIncrementApps,
          totalDecrementApps,
        },
        type: this.sequelize.QueryTypes.INSERT,
      });
      //update table users with the dailyTimeUsed,playTimeRemaining
      let updateSQL = `
      UPDATE users
      SET 
        dailyTimeUsed = :dailyTimeUsed,
        playTimeRemaining = :playTimeRemaining,
        total_increment_apps = :totalIncrementApps,
        total_decrement_apps = :totalDecrementApps,
        updateAt = NOW()
      WHERE 
        id = :kidId AND 
        is_register = 1 AND 
        is_active = 1 AND 
        user_type = 'kid'
    `;

      await this.sequelize.query(updateSQL, {
        replacements: {
          kidId,
          dailyTimeUsed,
          playTimeRemaining,
          totalIncrementApps,
          totalDecrementApps,
        },
        type: this.sequelize.QueryTypes.UPDATE,
      });
      // get  the latest usage for all other devices used by the kid today, excluding the current device
      const selectSQL = `
        SELECT
          kid_id,
          deviceId,
          date_time,
          dailyTimeLimit,
          dailyTimeRemaining,
          playTimeRemaining,
          dailyTimeUsed,
          total_increment_apps,
          total_decrement_apps
        FROM (
          SELECT *,
                 ROW_NUMBER() OVER (PARTITION BY deviceId ORDER BY date_time DESC) AS rn
          FROM kid_usage
          WHERE kid_id = :kidId
            AND date_time >= CURDATE() -- Filters entries from today (since midnight)
            AND deviceId != :currentDeviceId -- Exclude the current device
        ) as usage_today
        WHERE rn = 1;
      `;
      const otherDevicesUsage = await this.sequelize.query(selectSQL, {
        replacements: { kidId, currentDeviceId: deviceId },
        type: this.sequelize.QueryTypes.SELECT,
      });

      return res.status(200).send({
        message: "Data saved successfully",
        otherDevicesUsage,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred in usage.",
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
  // hello = async (req, res, io) => {
  //   try {
  //     Wlogger.log("info", "kid sey hello", "test1");
  //     await createSingleLog(
  //       this.sequelize,
  //       req,
  //       "Hello from kids controller",
  //       "/hello"
  //     );
  //     res.status(200).send("Hello from kids controller");
  //   } catch (err) {
  //     console.log(err);
  //     res.createErrorLogAndSend(this.sequelize, {
  //       err: err.message || "Some error occurred in hello.",
  //     });
  //   }
  // };

  // GET /api/kid/simulatejwttoken
  // simulateJwtToken = async (req, res) => {
  //   console.log(" at kid simulateJwtToken");
  //   try {
  //     const token = jwt.sign({ id: 1 }, "mysecretkey", { expiresIn: "1h" });
  //     res.status(200).send(token);
  //   } catch (err) {
  //     console.log(err);
  //     res.createErrorLogAndSend(this.sequelize, {
  //       err: err.message || "Some error occurred in simulateJwtToken.",
  //     });
  //   }
  // };
}
export default ControllerKids;
