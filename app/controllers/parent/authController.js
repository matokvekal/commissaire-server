import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";
import { createOTP } from "../../utils/authenticationUtils.js";
import { parentRegistrationSMS } from "../../utils/smsUtil.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import moment from "moment";

import {
  ServerLoginMessages,
  ServerErrors,
  ServerMessages,
} from "../../constants/constantMessages.js";

class AuthController extends BaseController {
  constructor(app, modelName, sequelize) {
    super(app, modelName, sequelize);
  }

  //very simple get api  /api/parent/reset  to delete user  with phone 0548847997 from the database from table users and table family
  reset = async (req, res) => {
    try {
      const phone = "0548047997";
      let SQL = `DELETE FROM users WHERE phone = :phone AND user_type = "parent"`;
      await this.sequelize.query(SQL, {
        replacements: { phone },
        type: QueryTypes.DELETE,
      });
      SQL = `DELETE FROM family WHERE parent_phone = :phone`;
      await this.sequelize.query(SQL, {
        replacements: { phone },
        type: QueryTypes.DELETE,
      });
      return res.status(200).send("User deleted successfully");
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/parent/register
  register = async (req, res) => {
    const { name, familyName, parentPhone, email, readAndAgreeTerms } =
      req.body;
    let parentStatus = "registered";
    await createSingleLog(
      this.sequelize,
      req,
      `parentPhone ${parentPhone} email:${email}`,
      "/parent/register"
    );
    // Check if required fields are present
    if (!name || !familyName || !parentPhone || !email || !readAndAgreeTerms) {
      return res.status(400).send(ServerErrors.MISSING_DETAILS);
    }

    try {
      const parent = await this.findParentByPhone(parentPhone);
      console.log("parent data", parent);

      // Check if parent is already registered and active
      if (parent) {
        if (parent.is_active !== 1) {
          return res.status(400).send(ServerErrors.CONTACT_ADMIN);
        }
        parentStatus = "login";
        // Check for too many OTP attempts in a short time
        if (
          parent.otp_trys >= 3 &&
          moment(parent.last_otp).isAfter(
            moment().subtract(config.otpConfirmationLimitsMinutes, "minutes")
          )
        ) {
          return res.status(400).send(ServerErrors.SMS_FAILED);
        }
      }

      const OTP = createOTP();
      const smsSent = await parentRegistrationSMS(parentPhone, OTP);

      // Handle failed SMS sending
      if (!smsSent) {
        return res.status(400).send(ServerErrors.SMS_FAILED);
      }

      // Update or insert parent data
      if (parent) {
        const updateSql = `UPDATE users SET otp = :OTP, otp_trys = otp_trys + 1,last_otp=now() WHERE phone = :parentPhone AND user_type = "parent"`;
        await this.sequelize.query(updateSql, {
          replacements: { parentPhone, OTP },
          type: QueryTypes.UPDATE,
        });
      } else {
        const insertSql = `INSERT INTO users (f_name, l_name, phone, email, user_type, otp, last_otp,read_agree_terms) VALUES (:name, :familyName, :parentPhone, :email, 'parent', :OTP, NOW(),1)`;
        await this.sequelize.query(insertSql, {
          replacements: { name, familyName, parentPhone, email, OTP },
          type: QueryTypes.INSERT,
        });
      }
      return res.status(200).send(ServerMessages.OTP_SENT_SUCCESS);
    } catch (err) {
      console.error("Error during registration:", err);
      // return res.status(500).send("An error occurred during registration.");
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/parent/confirm
  confirm = async (req, res) => {
    console.log("At parent confirm controller");
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).send(ServerErrors.MISSING_DETAILS);
    }
    try {
      await createSingleLog(
        this.sequelize,
        req,
        `parentPhone ${phone} otp:${otp}`,
        "/parent/confirm"
      );

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
        return res.status(400).send(ServerErrors.INVALID_OTP);
      }
      const currentTime = moment();
      const otpExpirationTime = moment(parent[0].last_otp).add(
        config.otpExpirationTimeInMinutes,
        "minutes"
      );
      if (currentTime.isAfter(otpExpirationTime)) {
        return res.status(400).send(ServerErrors.OTP_EXPIRED);
      }
      if (parent[0].is_register === 1) {
        const token = createJwtToken(parent[0].phone);
        res.setHeader("Authorization", `Bearer ${token}`);
        return res.status(400).send("User already registered");
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
      const token = createJwtToken(parent[0].phone);
      res.setHeader("Authorization", `Bearer ${token}`);
      return res.status(200).send(ServerMessages.AUTHORIZATION_SUCCESS);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  async findParentByPhone(parentPhone) {
    const SQL = `SELECT * FROM users WHERE phone = :parentPhone AND user_type = "parent"`;
    const [parent] = await this.sequelize.query(SQL, {
      replacements: { parentPhone },
      type: QueryTypes.SELECT,
    });
    return parent;
  }

  handleError(res, err, message) {
    console.error(err);
    res.status(500).send({ error: err.message || message });
  }
}
export default AuthController;

/* 1. Integration Tests for API Endpoints:
POST /api/parent/register

1.1 POST /api/parent/register with missing required fields: Send a request without name, familyName, or parentPhone to ensure the endpoint correctly handles and returns an error for missing fields.
Data: {"email":"test@example.com"}
1.2 POST /api/parent/register with existing inactive parent: Mock the database to return an inactive parent and ensure the endpoint returns the correct error message.
Data: {"name":"John", "familyName":"Doe", "parentPhone":"1234567890", "email":"test@example.com"}
1.3 POST /api/parent/register with excessive OTP attempts: Ensure the service correctly restricts further OTP attempts based on otp_trys and timing, returning an appropriate error.
Data: {"name":"John", "familyName":"Doe", "parentPhone":"1234567890", "email":"test@example.com"}
1.4 POST /api/parent/register successful OTP dispatch: Test successful OTP generation and SMS dispatch, including SQL INSERT/UPDATE operations for new or existing parents.
Data: {"name":"John", "familyName":"Doe", "parentPhone":"1234567890", "email":"test@example.com"}
POST /api/parent/confirm

1.5 POST /api/parent/confirm with missing parameters: Send a request without phone or otp and check for the correct error handling.
Data: {}
1.6 POST /api/parent/confirm with invalid OTP: Ensure that the endpoint correctly identifies and rejects invalid OTPs.
Data: {"phone":"1234567890", "otp":"wrong_otp"}
1.7 POST /api/parent/confirm with expired OTP: Test the OTP expiration logic to confirm that an expired OTP results in an error message.
Data: {"phone":"1234567890", "otp":"1234"}
1.8 POST /api/parent/confirm successful confirmation and family link: Verify that a valid OTP correctly updates the parent’s status and links them to a family, if not already linked.
Data: {"phone":"1234567890", "otp":"correct_otp"}
2. Error Handling Tests:
2.1 Simulate database failures: Test how the system behaves under database connection issues or SQL errors during both registration and confirmation.
2.2 Test error logging: Ensure that all errors are logged appropriately, and the error response is consistent with the error condition.
3. Security Tests:
3.1 Test input validation for SQL Injection: Ensure that all inputs are sanitized to prevent SQL Injection vulnerabilities.
3.2 Verify that sensitive data (like OTPs) is not logged: Check logs to ensure that OTPs or other sensitive information are not being inadvertently stored or logged.
4. Performance Tests:
4.1 Load test the register and confirm endpoints: Assess how the system performs under high traffic, particularly focusing on the database and SMS service responsiveness.
5. End-to-End Tests:
5.1 Complete registration flow: From sending the initial registration request through to confirming the OTP, ensure the entire flow works seamlessly and updates the database correctly.
5.2 Family linkage: Test scenarios where a parent is linked to a new or existing family during the registration confirmation process. */
