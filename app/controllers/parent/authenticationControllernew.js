import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { createJwtToken, createOTP } from "../../utils/authenticationUtils.js";
import { parentRegistrationSMS } from "../../utils/smsUtil.js";
import { format, isBefore, addSeconds, parseISO } from "date-fns"; // Replace moment.js

class AuthenticationController extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  async register(req, res) {
    const { name, familyName, parentPhone, email } = req.body;
    if (!name || !familyName || !parentPhone) {
      return res.status(400).send("Name, family name, and phone are required.");
    }

    try {
      const parent = await this.findParentByPhone(parentPhone);
      if (parent) {
        const registrationStatus = await this.checkParentStatus(parent);
        if (registrationStatus.error) {
          return res.status(400).send(registrationStatus.message);
        }
      }

      const OTP = createOTP();
      const smsSent = await parentRegistrationSMS(parentPhone, OTP);
      if (!smsSent) {
        return res.status(400).send("SMS not sent");
      }

      await this.updateOrInsertParent(parent, {
        name,
        familyName,
        parentPhone,
        email,
        OTP,
      });
      res.status(200).send("OTP sent to parent successfully.");
    } catch (err) {
      this.handleError(res, err, "Some error occurred in register.");
    }
  }

  async findParentByPhone(parentPhone) {
    const SQL = `SELECT * FROM users WHERE phone = :parentPhone AND user_type = "parent"`;
    const [parent] = await this.sequelize.query(SQL, {
      replacements: { parentPhone },
      type: QueryTypes.SELECT,
    });
    return parent;
  }

  async checkParentStatus(parent) {
    const lastOtpTime = parseISO(parent.last_otp);
    const currentTime = new Date();
    const timeDiffSeconds = (currentTime - lastOtpTime) / 1000;

    if (parent.is_active !== 1) {
      return { error: true, message: "User cannot register, contact support." };
    } else if (
      parent.otp_trys >= 3 &&
      timeDiffSeconds < config.otpTimeLimitSeconds
    ) {
      return {
        error: true,
        message: `You must wait ${
          config.otpTimeLimitSeconds - timeDiffSeconds
        } seconds before trying again.`,
      };
    }
    return { error: false };
  }

  async updateOrInsertParent(
    parent,
    { name, familyName, parentPhone, email, OTP }
  ) {
    if (parent) {
      const updateSql = `UPDATE users SET otp = :OTP, otp_trys = otp_trys + 1 WHERE phone = :parentPhone AND user_type = "parent"`;
      await this.sequelize.query(updateSql, {
        replacements: { parentPhone, OTP },
        type: QueryTypes.UPDATE,
      });
    } else {
      const currentTime = format(new Date(), "yyyy-MM-dd HH:mm:ss");
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
  }

  handleError(res, err, message) {
    console.error(err);
    res.status(500).send({ error: err.message || message });
  }
}

export default AuthenticationController;
