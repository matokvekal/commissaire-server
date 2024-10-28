import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import config from "../../config/index.js";
import jwt from "jsonwebtoken";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import Wlogger from "../../utils/winstonLogger.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
// import { createJwtToken } from "../../utils/authenticationUtils.js";
import isValidLocation from "../../utils/locationValidator.js";
import validatePackageNames, {
  validateAppNames,
} from "../../utils/validation.js";
import { appStatus, ServerNumbers } from "../../constants/serverConstants.js";
import {
  timeStringToSeconds,
  secondsToTimeString,
  calculateAvailableTime,
} from "../../utils/time.js";
import { logAppAction } from "../../statistic/apps.js";
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
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `GET/kid/registerDevice deviceTypeId:${deviceTypeId}`
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
        const device_id = result[0];
        return res.status(200).send({ device_id });
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in registerDevice.",
      });
    }
  };

  // Post /api/kid/updateApp
  updateApp = async (req, res) => {
    //We asume that device_type_id=1 is for All aps
    console.log(" at updateAppNew");
    try {
      const kidId = req.user.userId;
      // const userName = req.user.userName;
      const deviceId = req.body.kidDeviceId;
      const packageName = req.body.packageName;
      const action = req.body.action;
      let appDefaultStatus = appStatus.neutral;

      if (!packageName || !kidId || !deviceId || !action) {
        return res.status(400).send("Some data is missing");
      }
      await createSingleLog(
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `Post/kid/updateapp`
      );
      if (action !== "add" && action !== "remove") {
        return res.status(400).send("Invalid action");
      }
      let kidAppResults = [];
      let SQL =
        "select id, default_status, is_active from apps where device_type_id=1 and package_name=:packageName";
      const appResults = await this.sequelize.query(SQL, {
        replacements: { packageName },
        type: QueryTypes.SELECT,
      });
      if (appResults.length > 0) {
        SQL =
          "select * from kid_apps where kid_id=:kidId and kid_device_id=:deviceId and app_id=:appId";
        kidAppResults = await this.sequelize.query(SQL, {
          replacements: { kidId, deviceId, appId: appResults[0].id },
          type: QueryTypes.SELECT,
        });
      }

      if (action === "remove") {
        if (kidAppResults.length > 0 && kidAppResults[0].is_active) {
          SQL =
            "update kid_apps set is_active=0 where kid_id=:kidId and kid_device_id=:deviceId and app_id=:appId";
          await this.sequelize.query(SQL, {
            replacements: { kidId, deviceId, appId: appResults[0].id },
            type: QueryTypes.UPDATE,
          });
          logAppAction(
            this.sequelize,
            req.user.userId,
            packageName,
            appResults[0].id,
            1,
            "remove"
          );
          let app_id = appResults[0]?.id || insertedAppid;
          SQL = `UPDATE apps 
          SET total_remove = total_remove + 1, 
              total_instaled = CASE WHEN total_instaled > 0 THEN total_instaled - 1 ELSE 0 END
          WHERE id = :app_id`;
          await this.sequelize.query(SQL, {
            replacements: { app_id },
            type: QueryTypes.UPDATE,
          });

          //TODO here we send notification to the parent by socket
          return res.status(200).send("App removed successfully");
        }
        return res.status(404).send("App is not exist");
      } else {
        let insertedAppid;
        if (appResults.length === 0) {
          SQL = `insert into apps (app_name, package_name, device_type_id, default_status,add_by_user)
            values (:packageName, :packageName, 1, :defaultStatus,:kidId);`;
          const [id, metadata] = await this.sequelize.query(SQL, {
            replacements: {
              packageName,
              defaultStatus: appDefaultStatus,
              kidId,
            },
            type: QueryTypes.INSERT,
          });
          insertedAppid = id;
        }

        let appId = appResults[0]?.id || insertedAppid;
        let appstatus = appResults[0]?.default_status || appDefaultStatus;

        if (kidAppResults.length > 0) {
          SQL =
            "update kid_apps set is_active=1,parent_has_change=0  where kid_id=:kidId and kid_device_id=:deviceId and app_id=:appId";
          await this.sequelize.query(SQL, {
            replacements: { kidId, deviceId, appId },
            type: QueryTypes.UPDATE,
          });
        } else {
          SQL = `insert into kid_apps (kid_id, kid_device_id, app_id, status, is_active, is_exist,parent_has_change)
          values (:kidId, :deviceId, :appId, :status, 1, 1,0)`;
          await this.sequelize.query(SQL, {
            replacements: { kidId, deviceId, appId, status: appstatus },
            type: QueryTypes.INSERT,
          });
        }
        if (kidAppResults.length === 0) {
          //update statistic
          SQL = `UPDATE apps 
        SET total_add = total_add + 1, 
            total_instaled = CASE WHEN total_instaled > 0 THEN total_instaled - 1 ELSE 0 END 
        WHERE id = :appId`;
          await this.sequelize.query(SQL, {
            replacements: { appId },
            type: QueryTypes.UPDATE,
          });
        }
        logAppAction(
          this.sequelize,
          req.user.userId,
          packageName,
          appId,
          1,
          "add"
        );
        return res.status(200).send({ new: 0, status: appstatus });
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in updateAppNew.",
      });
    }
  };

  //POST /api/kid/appusage //TODO FIX
  appUsage = async (req, res) => {
    return res.status(400).send("This api is nor working ");
    console.log("at appusage");
    try {
      const kidId = req.user.userId;
      const userName = req.user.userName;
      const deviceId = req.body.deviceId;
      const appUsage = req.body.appUsage;

      await createSingleLog(
        kidId,
        this.sequelize, // Use Sequelize instance here
        req,
        `kidId:${kidId}`,
        `Post/kid/appusage`
      );

      if (!appUsage || !userName || !deviceId || !kidId) {
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
      const kidId = req.user.userId;
      // const { userId: kidId } = req.user;
      const { deviceId, dateTime, latitude, longitude } = req.body;

      await createSingleLog(
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `POST/kid/position dateTime:${dateTime},latitude:${latitude},longitude:${longitude}`
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
      // res.status(500).send(
      //    "Some error occurred in position."
      // );
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in position.",
      });
    }
  };
  //Get /api/kid/apps   kp-32
  //kid app will get list of apps with theres status, also  devideid from the query string
  //kid will send at request the device id
  //this api will cal at login or at any time the kid will get notification
  //app status : (>blocked, >always_on, leisure, beneficial, neutral)
  getApps = async (req, res) => {
    console.log(" at getApps");

    try {
      const kidId = req.user.userId;
      const deviceId = req.query.deviceid;
      await createSingleLog(
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `Get/kid/apps`
      );
      if (!kidId || !deviceId) {
        return res.status(400).send("some data is missing");
      }

      let SQL = `select ka.id,ka.status,ka.app_id,ap.package_name,ap.category,ka.order from kid_apps ka 
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
  //Get /api/kid/diamonds
  //kid get his total diamonds
  getDiamonds = async (req, res) => {
    console.log(" at getDiamonds");

    try {
      const kidId = req.user.userId;
      await createSingleLog(
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `Get/kid/diamonds`
      );
      if (!kidId) {
        return res.status(400).send("some data is missing");
      }
      const email = req.user.userName;
      let SQL = `select total_diamonds as diamonds from users    where  email=:email and user_type="kid" and is_active=1 
        `;
      const results = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });

      return res.status(200).send(results[0]);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getApps.",
      });
    }
  };

  //Get /api/kid/limits     kp-43
  //kid will get  startDayTime,endDayTime per ech day, and ratio,
  //this api will cal at login or at any time the kid will get notification
  limits = async (req, res) => {
    console.log("at limits");
    const code = "default-9";
    try {
      const code = 10; //in the future for forst time kid can get default/basic usage time schedule  using code, for now the default code is 1
      const kidId = req.user.userId;

      if (!kidId) {
        return res.status(400).send("Some data is missing");
      }
      await createSingleLog(
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        "GET/kid/limits "
      );
      // Call stored procedure to handle kid limits
      const SQL = `CALL handle_schedule(:kidId, :code)`;
      const replacements = { kidId, code };
      const results = await this.sequelize.query(SQL, {
        replacements,
        type: QueryTypes.SELECT,
      });

      // Since the query returns multiple result sets, we need to get the actual data from the first result set
      const limits = results ? results[1][0].week_schedule : [];
      return res.status(200).send(limits);
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
      // const { userId: kidId } = req.user;
      const kidId = req.user.userId;
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
        kidId,
        this.sequelize,
        req,
        `kidId:${kidId} `,
        `POST/kid/usage dateTime:${dateTime},dailyTimeLimit: ${dailyTimeLimit},dailyTimeRemaining:${dailyTimeRemaining},playTimeRemaining:${playTimeRemaining}`
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
        increment_apps = :totalIncrementApps,
        decrement_apps = :totalDecrementApps,
        dailyTimeLimit = :dailyTimeLimit,
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
          dailyTimeLimit,
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

  //put /api/kid/converdiamonds?amount=10

  convertDiamonds = async (req, res) => {
    console.log("at convertDiamonds");

    try {
      const kidId = req.user.userId;
      const amount = parseInt(req.query.amount);

      // Validate input
      if (!kidId || isNaN(amount) || amount <= 0) {
        return res.status(400).send("Invalid kid ID or amount");
      }

      const maxDiamonds = ServerNumbers.maxDiamonds; // Use the maxDiamonds constant
      if (amount < 1 || amount > maxDiamonds) {
        return res
          .status(400)
          .send(`amount must be between 1 and ${maxDiamonds}`);
      }

      // Fetch kid's data
      const kidDataSQL = `
        SELECT total_diamonds, dailyTimeLimit, dailyTimeUsed, playTimeRemaining
        FROM users
        WHERE id = :kidId AND is_register = 1 AND is_active = 1 AND user_type = 'kid'
      `;
      const kidData = await this.sequelize.query(kidDataSQL, {
        replacements: { kidId },
        type: QueryTypes.SELECT,
      });

      if (!kidData.length) {
        return res.status(404).send("Kid not found");
      }

      const {
        total_diamonds,
        dailyTimeLimit,
        dailyTimeUsed,
        playTimeRemaining,
      } = kidData[0];
      //  If the kid has fewer diamonds than the requested amount, use the max they have
      let diamonds = Math.min(amount, total_diamonds);
      // Calculate available playtime to add (based on daily limit)
      const availableSeconds = calculateAvailableTime(
        dailyTimeLimit,
        dailyTimeUsed
      );
      // Convert diamonds to playtime (1 diamond = 60 seconds)
      let addSeconds = diamonds * 60;
      //  If available time is less than what diamonds would provide, adjust the diamonds and time to add
      if (availableSeconds < addSeconds) {
        addSeconds = availableSeconds;
        diamonds = Math.floor(addSeconds / 60);
      }

      if (addSeconds <= 0) {
        return res.status(400).send("No diamonds left");
      }
      const newPlayTime = timeStringToSeconds(playTimeRemaining) + addSeconds;
      const newPlayTimeStr = secondsToTimeString(newPlayTime);
      const updateSQL = `
        UPDATE users
        SET 
          total_diamonds = total_diamonds - :diamonds,
          playTimeRemaining = :newPlayTimeStr,
          updateAt = NOW()
        WHERE 
          id = :kidId AND 
          is_register = 1 AND 
          is_active = 1 AND 
          user_type = 'kid'
      `;
      await this.sequelize.query(updateSQL, {
        replacements: {
          diamonds,
          newPlayTimeStr,
          kidId,
        },
        type: QueryTypes.UPDATE,
      });

      // Return a success response
      return res.status(200).send({
        message: `${diamonds} diamonds converted to ${
          addSeconds / 60
        } playtime minutes`,
      });
    } catch (err) {
      console.error("Error in convertDiamonds:", err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred while converting diamonds.",
      });
    }
  };
}
export default ControllerKids;
