import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import test from "../../routes/kid/temporarytest.js";
import { kidRegistrationSMS } from "../../utils/smsUtil.js";
import { verifyIdToken, getUserData } from "../../utils/fireBaseAuthUtil.js"; // Import Firebase utilities
import { createJwtToken, createOTP } from "../../utils/authenticationUtils.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import {
  ServerMessages,
  ServerErrors,
  ServerLoginMessages,
} from "../../constants/constantMessages.js";

import moment from "moment";
class AuthenticationController extends BaseController {
  constructor(app, modelName) {
    super(app, modelName);
  }

  //Post /api/kid/login
  login = async (req, res) => {
    try {
      console.log("at kid login controller");
      const { googleToken } = req.body;
      if (!googleToken) {
        return res.status(400).send(ServerErrors.API_BASE_CREATE_INVALID);
      }
      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
      }
      const { email } = getUserData(decodedToken);
      if (!email) {
        return res.status(400).send("some error occurred a1");
      }
      await createSingleLog(
        this.sequelize,
        req,
        `email:${email}`,
        "/kid/login"
      );
      let SQL = `select distinct * from users where  email=:email and user_type="kid" and is_active=1 `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });
      console.log("kid data", kid);
      if (kid.length === 0) {
        return res.status(400).send("you are not registered");
      }
      kid = kid[0];
      if (kid.is_active !== 1) {
        return res.status(400).send("contact admin to activate your account");
      }
      if (!kid.is_register) {
        return res.status(400).send("you are not registered");
      }
      SQL = `select distinct * from family where id=:family_id and is_active=1`;
      let family = await this.sequelize.query(SQL, {
        replacements: { family_id: kid.family_id },
        type: QueryTypes.SELECT,
      });
      if (family.length === 0) {
        return res.status(400).send("Family not exist");
      }
      family = family[0];
      const phoneNumber = family.parent_phone;
      if (!phoneNumber) {
        return res.status(400).send("Family not exist");
      }
      const messageBody = `Kid ${kid.f_name} ${kid.l_name} is trying to login to the Koali Time.,`;
      singleSmsSender(phoneNumber, messageBody, smsSender);
      const token = createJwtToken(kid.email);
      res.setHeader("Authorization", `Bearer ${token}`);
      return res.status(200).send(token);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/kid/register
  register = async (req, res) => {
    console.log("at kid register controller");
    try {
      let { firstName, parentPhone, googleToken } = req.body;

      if (!googleToken || !firstName || !parentPhone) {
        return res.status(400).send("some details are missing");
      }
      firstName = getFixedValue(firstName);
      parentPhone = getFixedValue(parentPhone);

      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
      }
      const { email, uid, name, picture } = getUserData(decodedToken);

      if (!email) {
        return res.status(400).send("some error occurred a1");
      }
      await createSingleLog(
        this.sequelize,
        req,
        `parentPhone ${parentPhone} email:${email}`,
        "/kid/register"
      );
      let SQL = `select distinct * from users where  email=:email and ( user_type="kid" or user_type="kid_temporary") `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email: email },
        type: QueryTypes.SELECT,
      });
      console.log("kid data", kid);

      if (kid.length > 0) {
        kid = kid[0];
        if (kid.is_active === 0) {
          return res.status(400).send("contact admin to activate your account");
        } else if (kid.is_register === 1) {
          return res.status(400).send("Kid already registered");
        } else if (
          kid.otp_trys >= 3 &&
          moment(kid.last_otp).isAfter(
            moment().subtract(config.otpConfirmationLimitsMinutes, "minutes")
          )
        ) {
          return res
            .status(400)
            .send("Too many tries, please wait before trying again.");
        }
      }

      SQL = `select distinct  * from family where  parent_phone=:parentPhone and is_active=1  `;
      let family = await this.sequelize.query(SQL, {
        replacements: { parentPhone },
        type: QueryTypes.SELECT,
      });
      console.log("family data", family);
      if (family.length === 0) {
        return res.status(400).send("Family not exist");
      }

      family = family[0];
      const OTP = createOTP();
      const smsSent = await kidRegistrationSMS(
        family.name,
        parentPhone,
        firstName,
        OTP,
        false //login
      );
      if (smsSent) {
        if (kid.length === 0) {
          kid = kid[0];
          SQL = `insert into users 
                  (email,f_name,l_name,user_type,family_id,otp,otp_trys,last_otp,google_uid, google_name, google_picture)
                  values 
                  (:email,:firstName,'${family.name}','kid_temporary',${family.id},${OTP},1,NOW(),'${uid}', '${name}', '${picture}')`;
          console.log("SQL", SQL);
          await this.sequelize.query(SQL, {
            replacements: { email, firstName },
            type: QueryTypes.INSERT,
          });
          return res.status(200).send("OTP sent successfully to parent");
        } else {
          SQL = `update users set otp=${OTP},otp_trys=otp_trys+1,last_otp=NOW() where id=${kid.id}`;
          await this.sequelize.query(SQL, {
            type: QueryTypes.UPDATE,
          });
          return res
            .status(200)
            .send("OTP sent successfully to parent for login");
        }
      } else {
        return res.status(400).send(ServerErrors.GENERAL_ERROR);
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/confirmcode
  confirmCode = async (req, res) => {
    console.log("At kid confirmCode controller");
    try {
      let { otp, googleToken } = req.body;

      if (!googleToken || !otp) {
        return res.status(400).send("some details are missing");
      }
      otp = getFixedValue(otp);

      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
      }
      const { email } = getUserData(decodedToken);

      if (!email) {
        return res.status(400).send("some error occurred a1");
      }

      await createSingleLog(
        this.sequelize,
        req,
        `otp: ${otp} email: ${email}`,
        "/kid/confirmCode"
      );

      let SQL = `select distinct * from users where  email=:email and ( user_type="kid" or user_type="kid_temporary") and is_active=1  and otp=${otp} and last_otp > NOW()-interval ${config.otpConfirmationLimitsMinutes} minute`;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });

      if (kid.length === 0) {
        return res.status(400).send("Invalid OTP or OTP expired");
      }
      kid = kid[0];
      if (kid.user_type === "kid" && kid.is_register === 1) {
        return res.status(400).send("Kid already registered");
      }

      SQL = `update users set is_register=1,otp_trys=0,user_type="kid" where id=${kid.id}`;
      await this.sequelize.query(SQL, {
        type: QueryTypes.UPDATE,
      });

      // if device_id for kid id not exist at kid_devices table, add
      SQL = `select distinct * from kid_devices where id=:kid_id`;
      let kidDevice = await this.sequelize.query(SQL, {
        replacements: { kid_id: kid.id },
        type: QueryTypes.SELECT,
      });
      if (kidDevice.length === 0 && req.deviceId) {
        SQL = `insert into kid_devices (kid_id,device_id,device_name) values (:kid_id,:device_id,:device_name)`;
        await this.sequelize.query(SQL, {
          replacements: {
            kid_id: kid.id,
            device_id: req.deviceId || "",
            device_name: req.deviceName || "",
          },
          type: QueryTypes.INSERT,
        });
      }
      const token = createJwtToken(kid.email);
      res.setHeader("Authorization", `Bearer ${token}`);
      return res.status(200).json({ token: token });
      //return token at header
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };
}
export default AuthenticationController;

/* 
Unit Tests for Individual Functions:

1.1 Test verifyIdToken with valid and invalid tokens.
1.2 Test getUserData with various decoded token structures.
1.3 Test createOTP for format, length, and randomness.
1.4 Test createJwtToken with representative user data.
Integration Tests for API Endpoints:

POST /api/kid/register
2.1 POST /api/kid/register with missing googleToken: {"firstName":"John", "lastName":"Doe", "parentPhone":"1234567890"}
2.2 POST /api/kid/register with invalid googleToken: {"googleToken":"invalidToken", "firstName":"John", "lastName":"Doe", "parentPhone":"1234567890"}
2.3 POST /api/kid/register with valid googleToken but missing user data fields: {"googleToken":"validToken"}
2.4 POST /api/kid/register for a successful registration, including all required data: {"googleToken":"validToken", "firstName":"John", "lastName":"Doe", "parentPhone":"1234567890"}
2.5 POST /api/kid/register to test behavior when the kid or family already exists.
2.6 POST /api/kid/register to test SMS functionality for different scenarios.
POST /api/kid/confirmCode
2.7 POST /api/kid/confirmCode with missing parameters: {"otp":"1234", "email":"test@example.com"}
2.8 POST /api/kid/confirmCode with incorrect OTP: {"phone":"1234567890", "otp":"wrong", "email":"test@example.com"}
2.9 POST /api/kid/confirmCode with expired OTP: {"phone":"1234567890", "otp":"expired", "email":"test@example.com"}
2.10 POST /api/kid/confirmCode for successful confirmation: {"phone":"1234567890", "otp":"1234", "email":"test@example.com"}
2.11 POST /api/kid/confirmCode testing database interaction for user status update.
Error Handling Tests:

3.1 Simulate database connection issues to test response.
3.2 Simulate failure of external services like Firebase or SMS services to test error handling.
Security Tests:

4.1 Ensure sensitive data is not logged or exposed.
4.2 Test input validation to prevent SQL injection and XSS attacks.
Performance Tests:

5.1 Test API endpoint performance under load, particularly for registration.
5.2 Measure response times to ensure they meet performance benchmarks.
End-to-End Tests:

6.1 Simulate the full registration process from token validation to database update.
6.2 Simulate the complete confirm code process to verify flow and database updates. */
