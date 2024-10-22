import config from "../config/index.js";
import cron from "node-cron";
// const { QueryTypes } = require('sequelize');
// const db = require("./../models");

// import { createSingleLog, createLogs } from '../utils/apiLoggerUtils.js';

const allowedAmountOfRequestsForIpPerMinute =
  config.allowedAmountOfRequestsForIpPerMinute;
// const allowedAmountOfRequestsForIpPerMinute = 5;
const allowedAmountOfRequestsForIpPerFullDay =
  config.allowedAmountOfRequestsForIpPerFullDay;

const minuteCronExecuteFormat = "*/1 * * * *";
const dayCronExecuteFormat = "0 0 */24 * * *";

let minuteDictionary = {};
let fullDayDictionary = {};

const addOrSetValueToObject = (object, key, value) => {
  if (object[key]) {
    object[key] += value;
  } else {
    object[key] = value;
  }
};

cron.schedule(minuteCronExecuteFormat, () => {
  minuteDictionary = {};
});

cron.schedule(dayCronExecuteFormat, () => {
  fullDayDictionary = {};
});

const blockUser = async (req, db, restData) => {
  if (req.user && req.company_id) {
    await db.user.update(
      { blocked: 1, block_date: new Date(), ...restData },
      {
        where: {
          user_name: req.user.user_name,
          company_id: req.company_id,
        },
      }
    );
  }
};

const updateRequsetLogs = async (
  db,
  req,
  current_request_amount_per_minutes,
  current_request_amount_per_day = 0
) => {
  await db.user.update(
    {
      current_request_amount_per_minutes,
      current_request_amount_per_day,
      current_request_time: new Date(),
    },
    {
      where: {
        user_name: req.user.user_name,
        company_id: req.company_id,
      },
    }
  );
  await createSingleLog(
    "createSingleLog teser",
    db,
    req,
    `User: ${req.user.user_name},per_minutes:${current_request_amount_per_minutes},per_day:${current_request_amount_per_day}`
  );

  // await db.query(
  //   `insert into logs (user_name)values('testuser')`,
  //   {
  //     type: QueryTypes.INSERT,
  //   }
  // );
};
// TODO: when ready - return it to true
const shouldCheck = false;

const userReqAmountCheckMiddleware = (db) => async (req, res, next) => {
  try {
    if (shouldCheck && req.user) {
      // if the user is not blocked
      if (!req.user.blocked) {
        const key = req.user.user_name;

        await updateRequsetLogs(
          db,
          req,
          minuteDictionary[key],
          fullDayDictionary[key]
        );
        if (
          !minuteDictionary[key] ||
          minuteDictionary[key] < allowedAmountOfRequestsForIpPerMinute
        ) {
          addOrSetValueToObject(minuteDictionary, key, 1);
        } else {
          await blockUser(req, db, {
            requestsPerMinute: minuteDictionary[key],
          });
          throw "TOO MANY REQUESTS IN A MINUTE";
        }
        if (
          !fullDayDictionary[key] ||
          fullDayDictionary[key] < allowedAmountOfRequestsForIpPerFullDay
        ) {
          addOrSetValueToObject(fullDayDictionary, key, 1);
        } else {
          await blockUser(req, db, { requestsPerDay: fullDayDictionary[key] });
          throw "TOO MANY REQUESTS IN 24 HOURS";
        }
        return next();
      }
      throw {
        message: `USER ${req.user.user_name} IS BLOCKED AND CANNOT COMPLETE THE REQUEST`,
        status: 403,
      };
    }
    return next();
  } catch (err) {
    res.createErrorLogAndSend(this.sequelize, {
      message: `${err.message || err}`,
      status: err.status || 429,
    });
  }
};

export default userReqAmountCheckMiddleware;
