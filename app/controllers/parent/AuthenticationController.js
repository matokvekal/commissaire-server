import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";
import { createOTP } from "../../utils/authenticationUtils.js";
import { parentRegistrationSMS } from "../../utils/smsUtil.js";
import moment from "moment";

class AuthenticationController extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  // POST /api/parent/register
  register = async (req, res) => {
    try {
      const { name, familyName, parentPhone, email } = req.body;
      if (!name || !familyName || !parentPhone) {
        return res
          .status(400)
          .send("Name, family name, and phone are required.");
      }

      const SQL = `SELECT DISTINCT * FROM users WHERE phone = :parentPhone AND user_type = "parent"`;
      const parent = await this.sequelize.query(SQL, {
        replacements: { parentPhone },
        type: QueryTypes.SELECT,
      });

      console.log("parent data", parent);

      if (parent.length > 0) {
        if (parent[0].is_active !== 1) {
          return res.status(400).send("User canot register contact support.");
        }

        if (
          parent[0].otp_trys >= 3 &&
          parent[0].last_otp > now() - config.otpTimeLimitSeconds
        ) {
          return res
            .status(400)
            .send(
              `You must wait ${config.otpTimeLimitSeconds} seconds before trying again.`
            );
        }
      }
      const OTP = createOTP();
      const smsSent = await parentRegistrationSMS(parentPhone, OTP);
      if (!smsSent) {
        return res.status(400).send("SMS not sent");
      }

      if (parent.length > 0) {
        const updateSql = `UPDATE users SET otp = :OTP, otp_trys = otp_trys + 1 WHERE phone = :parentPhone AND user_type = "parent"`;
        await this.sequelize.query(updateSql, {
          replacements: { parentPhone, OTP },
          type: QueryTypes.UPDATE,
        });
      } else {
        const currentTime = moment().format("YYYY-MM-DD HH:mm:ss"); // Format the current time for SQL
        const insertSql = `INSERT INTO users (f_name, l_name, phone, email, user_type, otp, last_otp) VALUES (:name, :familyName, :parentPhone, :email, 'parent', :OTP, :currentTime)`;
        await this.sequelize.query(insertSql, {
          replacements: {
            name,
            familyName,
            parentPhone,
            email,
            OTP,
            currentTime,
          },
          type: QueryTypes.INSERT,
        });
      }
      return res.status(200).send("otp sent to parent successfully.");
    } catch (err) {
      this.handleError(res, err, "Some error occurred in register.");
    }
  };

  handleError = (res, err, message) => {
    console.error(err);
    res.createErrorLogAndSend(this.sequelize, {
      err: err.message || message,
    });
  };

  // POST /api/parent/confirm
  confirm = async (req, res) => {
    console.log("At parent confirm controller");
    const otpAattemps = config.sms_otp_attempt_limit;
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).send("Phone number, OTP are required.");
      }

      const cleanedOtp = getFixedValue(otp);
      const cleanedPhone = getFixedValue(phone);
      // Retrieve the parent user with the given phone and OTP
      let SQL =
        "SELECT DISTINCT * FROM users WHERE phone=:phone AND user_type='parent' AND otp=:otp";

      let parent = await this.sequelize.query(SQL, {
        replacements: { phone: cleanedPhone, otp: cleanedOtp },
        type: QueryTypes.SELECT,
      });

      if (parent.length === 0) {
        return res.status(400).send("Invalid OTP or user not found.");
      }
      const currentTime = moment();
      const otpExpirationTime = moment(parent[0].last_otp).add(
        config.otpConfirmationLimitsSeconds,
        "seconds"
      );
      if (
        parent[0].otp_trys >= otpAattemps &&
        currentTime.isBefore(otpExpirationTime)
      ) {
        return res.status(400).send("OTP time expired, register again");
      }

      SQL = "UPDATE users SET is_register=1, otp_trys=0 WHERE id=:id";
      await this.sequelize.query(SQL, {
        replacements: { id: parent[0].id },
        type: QueryTypes.UPDATE,
      });

      SQL =
        "SELECT DISTINCT * FROM family WHERE parent_phone=:cleanedPhone AND is_active=1";
      let family = await this.sequelize.query(SQL, {
        replacements: { cleanedPhone },
        type: QueryTypes.SELECT,
      });

      console.log("family data", family);

      if (!family || family.length === 0) {
        SQL =
          "INSERT INTO family (name, parent_phone, user_created) VALUES (:name, :parentPhone, :userId)";
        const results = await this.sequelize.query(SQL, {
          replacements: {
            name: parent[0].l_name,
            parentPhone: cleanedPhone,
            userId: parent[0].id,
          },
          type: QueryTypes.INSERT,
        });
        console.log("results", results);
      }

      //get the last id from the inserted family

      if (!parent[0].family_id) {
        // for registration

        const lastInsertId = await this.sequelize.query(
          "SELECT LAST_INSERT_ID() as id",
          {
            type: QueryTypes.SELECT,
          }
        );
        const familyId = lastInsertId[0].id;

        SQL = `update users set family_id=:familyId where id=${parent[0].id}`;
        await this.sequelize.query(SQL, {
          replacements: { familyId: family[0] ? family[0].id : familyId },
          type: QueryTypes.UPDATE,
        });
      }

      return res.status(200).send("Parent confirmed successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in confirm.",
      });
    }
  };
}
export default AuthenticationController;
