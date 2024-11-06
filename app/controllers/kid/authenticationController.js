import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import test from "../../routes/kid/kid.js";
import { kidRegistrationSMS, singleSmsSender } from "../../utils/smsUtil.js";
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
      console.log("at kid login controller...");
      const { googleToken } = req.body;
      console.log("googleToken", googleToken);
      await createSingleLog(
        "try login kid",
        this.sequelize,
        req,
        `googleToken ${googleToken} `,
        "/kid/login"
      );

      if (!googleToken) {
        return res.status(400).send(ServerErrors.MISSING_DETAILS);
      }
      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      const { email } = getUserData(decodedToken);
      if (!email) {
        console.log("no email kid login");
        // return res.status(400).send(ServerErrors.SOME_ERROR_OCCURRED);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in kid login 1.",
        });
      }
      console.log("valid", valid, "decodedToken", decodedToken, "error", error);
      await createSingleLog(
        email,
        this.sequelize,
        req,
        `valid ${valid};error ${error} `,
        "/kid/login"
      );
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        // return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.2",
        });
      }

      let SQL = `select distinct * from users where  email=:email and user_type="kid" and is_active=1 `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });
      console.log("kid data1", kid);
      if (kid.length === 0) {
        // return res.status(400).send(ServerErrors.NOT_REGISTERED);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.3",
        });
      }
      kid = kid[0];
      if (kid.is_active !== 1) {
        // return res.status(400).send(ServerErrors.CONTACT_ADMIN);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.4",
        });
      }
      if (!kid.is_register) {
        // return res.status(400).send(ServerErrors.NOT_REGISTERED);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.5",
        });
      }
      SQL = `select distinct * from family where id=:family_id and is_active=1`;
      let family = await this.sequelize.query(SQL, {
        replacements: { family_id: kid.family_id },
        type: QueryTypes.SELECT,
      });
      if (family.length === 0) {
        // return res.status(400).send(ServerErrors.FAMILY_NOT_EXIST);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.6",
        });
      }
      family = family[0];
      const phoneNumber = family.parent_phone;
      if (!phoneNumber) {
        // return res.status(400).send(ServerErrors.FAMILY_NOT_EXIST);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in login kid.7",
        });
      }
      //TODO
      //change this code to send Email instead of sms in case sms failer
      // const messageBody = `Kid ${kid.f_name} ${kid.l_name} is trying to login to the Koali Time.,`;
      // singleSmsSender(phoneNumber, messageBody);
      const token = createJwtToken(kid.email, "kid");
      return res
        .setHeader("Authorization", `Bearer ${token}`)
        .status(200)
        .send(ServerMessages.AUTHORIZATION_SUCCESS);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in login kid.8",
      });
    }
  };

  // POST /api/kid/register
  register = async (req, res) => {
    console.log("at kid register controller");
    try {
      let { firstName, parentPhone, googleToken, readAndAgreeTerms } = req.body;

      if (!googleToken || !firstName || !parentPhone || !readAndAgreeTerms) {
        return res.status(400).send(ServerErrors.MISSING_DETAILS);
      }
      firstName = getFixedValue(firstName);
      parentPhone = getFixedValue(parentPhone);
      console.log("at kid register controller googleToken", googleToken);
      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        // return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in register kid.1",
        });
      }
      const { email, uid, name, picture, phone_number } =
        getUserData(decodedToken);

      if (!email) {
        return res.status(400).send(ServerErrors.SOME_ERROR_OCCURRED);
      }
      await createSingleLog(
        email,
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
          return res.status(400).send(ServerErrors.CONTACT_ADMIN);
        } else if (kid.is_register === 1) {
          return res.status(400).send(ServerErrors.KID_ALREADY_REGISTERED);
        } else if (
          kid.otp_trys >= 3 &&
          moment(kid.last_otp).isAfter(
            moment().subtract(config.otpConfirmationLimitsMinutes, "minutes")
          )
        ) {
          // return res.status(400).send(ServerErrors.TOO_MANY_TRIES);
          res.createErrorLogAndSend(this.sequelize, {
            err: err.message || "Some error occurred in register kid.2",
          });
        }
      }

      SQL = `select distinct  * from family where  parent_phone=:parentPhone and is_active=1  `;
      let family = await this.sequelize.query(SQL, {
        replacements: { parentPhone },
        type: QueryTypes.SELECT,
      });
      console.log("family data", family);
      if (family.length === 0) {
        // return res.status(400).send(ServerErrors.FAMILY_NOT_EXIST);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in register kid.3",
        });
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
                  (email,f_name,l_name,user_type,family_id,otp,otp_trys,last_otp,google_uid, google_name, google_picture,read_agree_terms)
                  values 
                  (:email,:firstName,'${family.name}','kid_temporary',${family.id},${OTP},1,NOW(),'${uid}', '${name}', '${picture}',1)`;
          console.log("SQL", SQL);
          await this.sequelize.query(SQL, {
            replacements: { email, firstName },
            type: QueryTypes.INSERT,
          });
          return res.status(200).send(ServerMessages.OTP_SENT_SUCCESS);
        } else {
          SQL = `update users set otp=${OTP},otp_trys=otp_trys+1,last_otp=NOW() where id=${kid.id}`;
          await this.sequelize.query(SQL, {
            type: QueryTypes.UPDATE,
          });
          return res.status(200).send(ServerMessages.OTP_SENT_SUCCESS);
        }
      } else {
        // return res.status(400).send(ServerErrors.GENERAL_ERROR);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in register kid.4",
        });
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/kid/confirmcode
  confirmCode = async (req, res) => {
    console.log("At kid confirmCode controller");
    try {
      let { otp, googleToken } = req.body;

      if (!googleToken || !otp) {
        return res.status(400).send(ServerErrors.MISSING_DETAILS);
      }
      otp = getFixedValue(otp);

      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        // return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in confirmCode kid.1",
        });
      }
      const { email } = getUserData(decodedToken);

      if (!email) {
        // return res.status(400).send(ServerErrors.SOME_ERROR_OCCURRED);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in confirmCode kid.2",
        });
      }

      await createSingleLog(
        email,
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
        console.log("Invalid OTP");
        return res.status(400).send(ServerErrors.INVALID_OTP);
      }
      kid = kid[0];
      if (kid.user_type === "kid" && kid.is_register === 1) {
        // return res.status(400).send(ServerErrors.KID_ALREADY_REGISTERED);
        res.createErrorLogAndSend(this.sequelize, {
          err: err.message || "Some error occurred in confirmCode kid.3",
        });
      }

      SQL = `update users set is_register=1,otp_trys=0,user_type="kid" where id=${kid.id}`;
      await this.sequelize.query(SQL, {
        type: QueryTypes.UPDATE,
      });

      SQL = "select id,type from device_types where is_active=1";
      const devices = await this.sequelize.query(SQL, {
        type: QueryTypes.SELECT,
      });
      console.log("devices", devices);

      // SQL = `select distinct * from kid_devices where id=:kid_id`;
      // let kidDevice = await this.sequelize.query(SQL, {
      //   replacements: { kid_id: kid.id },
      //   type: QueryTypes.SELECT,
      // });
      // if (kidDevice.length === 0 && req.deviceId) {
      //   SQL = `insert into kid_devices (kid_id,device_id,device_name) values (:kid_id,:device_id,:device_name)`;
      //   await this.sequelize.query(SQL, {
      //     replacements: {
      //       kid_id: kid.id,
      //       device_id: req.deviceId || "",
      //       device_name: req.deviceName || "",
      //     },
      //     type: QueryTypes.INSERT,
      //   });
      // }
      const token = createJwtToken(kid.email, "kid");
      res.setHeader("Authorization", `Bearer ${token}`);
      return res.status(200).json({ devices: devices });
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
