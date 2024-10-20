import BaseController from "../kid/baseController.js";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { QueryTypes } from "sequelize";
import checkType from "../../utils/checkType.js";
import { allowedFields } from "../../constants/serverConstants.js";
import SocketManager from "../../handlers/websocketHandler.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";

async function isKidInSameFamily(sequelize, parent_id, kidId) {
  const SQL = `
      SELECT EXISTS (
          SELECT 1
          FROM users AS parent
          JOIN users AS kid ON parent.family_id = kid.family_id
          WHERE parent.id = :parent_id
          AND parent.is_active = 1
          AND parent.is_register = 1
          AND parent.user_type = 'parent'
          AND kid.id = :kidId
          AND kid.is_active = 1
          AND kid.is_register = 1
          AND kid.user_type = 'kid'
      ) AS family_check;
  `;
  const familyCheck = await sequelize.query(SQL, {
    replacements: { parent_id, kidId },
    type: QueryTypes.SELECT,
  });
  return familyCheck[0].family_check;
}
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
      const SQL =
        "update users set firebase_notification_token = :token where id = :parent_id";
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
  };

  //GET api/parent/kids
  //kp-48
  getKids = async (req, res) => {
    console.log("getKids");
    try {
      const parent_id = req.user.userId;
      if (!parent_id) {
        return res.status(400).send("some data is missing");
      }

      const SQL =
        "select id,f_name,l_name from users where family_id like(select distinct family_id from users where id=:parent_id and is_active=1 and is_register=1 and user_type='parent') and is_register=1 and is_active=1 and user_type='kid'";
      const kids = await this.sequelize.query(SQL, {
        replacements: { parent_id },
        type: QueryTypes.SELECT,
      });
      return res.status(200).send({ kids });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getting kids.",
      });
    }
  };

  // //POST api/parent/disable
  // disableKids = async (req, res) => {
  //   console.log("disableKids");
  //   try {
  //     const parent_id = req.user.userId;
  //     if (!parent_id) {
  //       return res.status(400).send("some data is missing");
  //     }
  //     const { status } = req.body;
  //     console.log("disableStatus", status);
  //     // const SQL =
  //     //   "select id,f_name,l_name from users where family_id like(select distinct family_id from users where id=:parent_id and is_active=1 and is_register=1 and user_type='parent') and is_register=1 and is_active=1 and user_type='kid'";
  //     // const kids = await this.sequelize.query(SQL, {
  //     //   replacements: { parent_id },
  //     //   type: QueryTypes.SELECT,
  //     // });
  //     return res.status(200).send({ disableStatus: status });
  //   } catch (err) {
  //     console.log(err);
  //     res.createErrorLogAndSend(this.sequelize, {
  //       err: err.message || "Some error occurred in getting kids.",
  //     });
  //   }
  // };

  //GET api/parent/kidsusage
  //kp-48
  //this gat api is get the parent family id  and then go to table kid_usage for those kids and  get the lastrow by  created at of the kid_id  with all his device_ids that are  for today
  getUsage = async (req, res) => {
    console.log("At getUsage");
    try {
      const parent_id = req.user.userId;
      const familyId = req.user.familyId;
      if (!parent_id || !familyId) {
        return res.status(400).send("Some data is missing");
      }
      const SQL = `
      SELECT 
        u.id as kid_id,
        ku.deviceId,
        ku.date_time,
        ku.dailyTimeLimit,
        ku.dailyTimeRemaining,
        ku.playTimeRemaining,
        ku.dailyTimeUsed,
        ku.total_increment_apps,
        ku.total_decrement_apps
      FROM (
        SELECT *,
               ROW_NUMBER() OVER (PARTITION BY kid_id, deviceId ORDER BY date_time DESC) as rn
        FROM koalidb.kid_usage
        WHERE date_time >= CURDATE() -- Filters entries from today (since midnight)
      ) ku
      JOIN (
        SELECT id
        FROM koalidb.users
        WHERE family_id = :familyId
          AND user_type = 'kid'
          AND is_register = 1
          AND is_active = 1
      ) u ON ku.kid_id = u.id
      WHERE ku.rn = 1;
    `;
      const usage = await this.sequelize.query(SQL, {
        replacements: { familyId },
        type: this.sequelize.QueryTypes.SELECT,
      });
      return res.status(200).send({ usage });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: err.message || "Some error occurred in getting usage.",
      });
    }
  };

  //POST api/parent/limits
  //kp-41
  postLimits = async (req, res) => {
    try {
      const { userId: parent_id } = req.user;
      const { kidId, ...incomingLimits } = req.body;

      console.log(
        "At postLimits userId:",
        parent_id,
        " kidId:",
        kidId,
        " incomingLimits:",
        incomingLimits
      );
      await createSingleLog(
        this.sequelize,
        req,
        `parent_id:${parent_id} set limit to kidId:${kidId}`,
        "/parent/limits",
        JSON.stringify(incomingLimits)
      );
      if (!parent_id || !kidId) {
        return res.status(400).send("Required data is missing.");
      }

      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res.status(400).send("Some errors at postLimits.");
      }

      const invalidFields = Object.entries(incomingLimits).filter(
        ([key, value]) =>
          !allowedFields[key] || !checkType(value, allowedFields[key])
      );

      if (invalidFields.length > 0) {
        return res
          .status(400)
          .send("Invalid or improperly formatted fields provided.");
      }

      const updates = Object.entries(incomingLimits)
        .filter(([key, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key} = :${key}`)
        .join(", ");

      if (updates.length === 0) {
        return res.status(400).send("No valid fields to update.");
      }

      const SQL = `UPDATE kids SET ${updates}, updateAt = NOW() WHERE kid_id = :kidId AND is_active = 1 ;`;
      console.log(SQL);
      console.log({ ...incomingLimits, kidId });
      await this.sequelize.query(SQL, {
        replacements: { ...incomingLimits, kidId },
        type: QueryTypes.UPDATE,
      });
      SocketManager.sendMessageToUser(kidId, "limits");
      return res.status(200).send("Limits updated successfully.");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred while updating limits.",
      });
    }
  };

  //GET api/parent/kidsbydevices
  getKidsByDevices = async (req, res) => {
    console.log("getKidsByDevices");
    try {
      const parent_id = req.user.userId;
      if (!parent_id) {
        return res.status(400).send("some data is missing");
      }

      const SQL = `
      SELECT 
        u.id, 
        u.family_id,
        u.f_name AS fName,
        u.l_name AS lName,
        kd.serial,
        kd.device_name AS deviceName,
        kd.id AS deviceId,
        u.locationX,
        u.locationY,
        u.dailyTimeLimit AS total,
        u.dailyTimeUsed AS used,
        u.playTimeRemaining AS play,
        increment_apps As increment,
        decrement_apps As decrement,
        u.updateAt
      FROM users u
      LEFT JOIN kid_devices kd ON u.id = kd.kid_id
      WHERE u.family_id IN (
        SELECT DISTINCT family_id 
        FROM users 
        WHERE id = :parent_id 
          AND is_active = 1 
          AND is_register = 1 
          AND user_type = 'parent'
      )
      AND u.is_register = 1 
      AND u.is_active = 1 
      AND u.user_type = 'kid'
      AND kd.is_active = 1
    `;
      const kids = await this.sequelize.query(SQL, {
        replacements: { parent_id },
        type: QueryTypes.SELECT,
      });
      return res.status(200).send({ kids });
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in getting kids.",
      });
    }
  };

  //GET api/parent/kidapps
  async getKidApps(req, res) {
    try {
      const { kidId, deviceId } = req.query;
      const parent_id = req.user.userId;
      console.log("at getKidApps ,kidId", kidId, "deviceId", deviceId);
      if (!kidId || !deviceId) {
        return res.status(400).send("Missing required parameters.");
      }

      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res.status(400).send("Some errors at getKidApps.");
      }

      const SQL = `
      SELECT 
        ka.id, 
        ka.status, 
        a.order,
        IF(
          TIMESTAMPDIFF(WEEK, ka.update_date, NOW()) > 1, 
          0, 
          IF(ka.parent_has_change = 1, 0, 1)
        ) AS last_updated,
        a.app_name, 
        a.package_name, 
        a.category,
        a.id as appId,
        a.google_icon as icon
      FROM kid_apps ka
      LEFT JOIN koalidb.apps a 
        ON ka.app_id = a.id
      WHERE ka.kid_id = :kidId 
        AND ka.kid_device_id = :deviceId 
        AND ka.is_exist = 1 
        AND ka.is_active = 1
        AND a.is_active = 1;
    `;

      const kidApps = await this.sequelize.query(SQL, {
        replacements: { kidId, deviceId },
        type: QueryTypes.SELECT,
      });

      if (kidApps.length === 0) {
        return res.status(404).send("No apps found for this kid and device.");
      }
      return res.status(200).send({ kidApps });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message: err.message || "Some error occurred in fetching kid apps.",
      });
    }
  }
  //POST api/parent/appstatus
  async updateKidAppStatus(req, res) {
    try {
      const { kidId, deviceId, appId, status, id } = req.body; //id is the row id of table kids app
      const parent_id = req.user.userId;
      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res.status(400).send("Some errors at updateKidAppStatus.");
      }
      // Validate input
      if (!kidId || !deviceId || !appId || !status || !id) {
        return res.status(400).send("Missing required parameters.");
      }

      // Allowed statuses (adjust if necessary)
      const allowedStatuses = [
        "blocked",
        "always_on",
        "leisure",
        "beneficial",
        "neutral",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).send("Invalid status provided.");
      }

      // Update the status in the kid_apps table
      const SQL = `
      UPDATE kid_apps 
      SET status = :status, parent_has_change = 1, update_date = NOW() 
      WHERE kid_id = :kidId 
        AND kid_device_id = :deviceId 
        AND app_id = :appId
        AND is_active = 1 
        AND is_exist = 1;
    `;

      const [updatedRows] = await this.sequelize.query(SQL, {
        replacements: { kidId, deviceId, appId, status },
        type: QueryTypes.UPDATE,
      });
      //just for testing
      console.log("SQL:", SQL);

      if (updatedRows === 0) {
        return res
          .status(404)
          .send("No matching record found or nothing updated.");
      }

      return res.status(200).send("App status updated successfully.");
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while updating app status.",
      });
    }
  }
  //GET api/parent/kidsdeviceusage
  KidsUsageByDevices = async (req, res) => {
    console.log("At KidsUsageByDevices");

    //TODO check that this kid id belong to this parent

    try {
      const parent_id = req.user.userId;
      const familyId = req.user.familyId;
      if (!parent_id || !familyId) {
        return res.status(400).send("Some data is missing");
      }
      const SQL = `
      WITH LatestUsage AS (
        SELECT 
          ku.kid_id,
          ku.deviceId,
          ku.dailyTimeLimit AS total,
          ku.dailyTimeUsed AS used,
          ku.playTimeRemaining AS play,
          ku.date_time,
          ROW_NUMBER() OVER (PARTITION BY ku.kid_id, ku.deviceId ORDER BY ku.date_time DESC) AS row_num
        FROM kid_usage ku
        INNER JOIN kid_devices kd ON ku.deviceId = kd.id
        WHERE kd.is_active = 1
      )
          SELECT 
            kid_id,
            deviceId,
            total,
            used,
            play,
            date_time
          FROM LatestUsage
          WHERE row_num = 1
          AND kid_id IN (
            SELECT id
            FROM users
            WHERE family_id = :familyId
              AND is_active = 1
              AND is_register = 1
              AND user_type = 'kid'
          );
    `;
      const usage = await this.sequelize.query(SQL, {
        replacements: { familyId },
        type: this.sequelize.QueryTypes.SELECT,
      });
      return res.status(200).send({ usage });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message:
          err.message || "Some error occurred in getting KidsUsageByDevices.",
      });
    }
  };

  // GET /api/parent/schedule/:kidId
  async getKidSchedule(req, res) {
    try {
      const { kidId } = req.params;
      const parent_id = req.user.userId;

      if (!kidId || kidId === "" || kidId === undefined) {
        return res.status(400).send("Missing kidId parameter.");
      }
      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );
      if (!isInSameFamily) {
        return res.status(400).send("Some errors at getKidSchedule.");
      }
      //TODO check that this kid id belong to this parent
      const SQL = `
      SELECT day, start_time, end_time, screen_time_control, daily_schedule, quality_control, initial_play_time, total_usage_time
      FROM daily_schedule
      WHERE kid_id = :kidId AND is_active = 1;
    `;

      const schedule = await this.sequelize.query(SQL, {
        replacements: { kidId },
        type: QueryTypes.SELECT,
      });

      if (!schedule.length) {
        return res
          .status(404)
          .send("No active schedule found for the specified kid.");
      }

      return res.status(200).send({ schedule });
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message:
          err.message || "Some error occurred in fetching the kid's schedule.",
      });
    }
  }

  // POST /api/parent/schedule
  async updateschedule(req, res) {
    try {
      //TODO check that this kid id belong to this parent
      const { kidId, days } = req.body;
      const { userId: parent_id } = req.user;
      if (!kidId || !days || !Array.isArray(days) || days.length === 0) {
        return res.status(400).send("Missing or invalid data.");
      }

      const isInSameFamily = await isKidInSameFamily(
        this.sequelize,
        parent_id,
        kidId
      );

      if (!isInSameFamily) {
        return res
          .status(403)
          .send("Unauthorized access to this kid's schedule.");
      }
//check that the kid has data befor update
      const  dayCount  = await this.sequelize.query(
        `
        SELECT COUNT(*) as dayCount 
        FROM daily_schedule
        WHERE kid_id = :kidId AND is_active = 1
      `,
        {
          replacements: { kidId },
          type: QueryTypes.SELECT,
        }
      );

      if (dayCount[0]?.dayCount !== 7) {
        return res
          .status(400)
          .send("Not all days exist for this kid's schedule.");
      }

      const updatePromises = days.map(async (dayData) => {
        const { day, ...fields } = dayData;

        if (!day) {
          return Promise.resolve();
        }

        const allowedFields = [
          "start_time",
          "end_time",
          "screen_time_control",
          "daily_schedule",
          "quality_control",
          "initial_play_time",
          "total_usage_time",
          "is_active",
        ];

        const updateFields = Object.keys(fields)
          .filter(
            (field) =>
              allowedFields.includes(field) && fields[field] !== undefined
          )
          .map((field) => `${field} = :${field}`);

        if (updateFields.length > 0) {
          const SQL = `
          UPDATE daily_schedule
          SET ${updateFields.join(", ")}, updated_at = NOW()
          WHERE kid_id = :kidId AND day = :day AND is_active = 1;
        `;

          return this.sequelize.query(SQL, {
            replacements: {
              kidId,
              day,
              ...fields,
            },
            type: QueryTypes.UPDATE,
          });
        }
      });

      const results = await Promise.allSettled(updatePromises);

      const failedUpdates = results.filter(
        (result) => result.status === "rejected"
      );
      if (failedUpdates.length > 0) {
        console.warn(`${failedUpdates.length} updates failed`);
      }

      return res.status(200).send("Schedule update process completed.");
    } catch (err) {
      console.error(err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while updating the schedule.",
      });
    }
  }
}
export default ControllerParents;
