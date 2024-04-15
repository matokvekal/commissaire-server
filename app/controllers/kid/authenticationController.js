import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import test from "../../routes/kid/temporarytest.js";
import { kidRegistrationSMS } from "../../utils/smsUtil.js";
import { verifyIdToken, getUserData } from "../../utils/fireBaseAuthUtil.js"; // Import Firebase utilities
import {getDataFromGoogleToken, createJwtToken, createOTP,} from "../../utils/authenticationUtils.js";
import { ServerMessages } from "../../constants/ServerMessages.js";

class AuthenticationController extends BaseController {
  constructor(app, modelName) {
    super(app, modelName);
  }
  // POST /api/kid/register
  register = async (req, res) => {
    console.log("at kid register controller");
    try {
      let { firstName, lastName, parentPhone, googleToken } = req.body;
      if (!googleToken) {
        return res.status(400).send(ServerErrors.API_BASE_CREATE_INVALID);
      }

      const decodedToken = await verifyIdToken(googleToken); // Verify the Google ID token
      const { email, uid, name, picture } = getUserData(decodedToken);

      console.log("userData", userData);

      if (!email) {
        return res.status(400).send(ServerErrors.API_BASE_CREATE_INVALID);
      }
      let SQL = `select distinct * from users where  email=:email and user_type="kid" `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email: userData.email },
        type: QueryTypes.SELECT,
      });
      console.log("kid data", kid);
      SQL = `select distinct  * from family where  parent_phone=:parentPhone and is_active=1  `;
      let family = await this.sequelize.query(SQL, {
        replacements: { parentPhone },
        type: QueryTypes.SELECT,
      });
      console.log("family data", family);
      //kid not exist
      if (family.length === 0) {
        //here we can create family and kid,then sent the parent sms to download the app
        return res.status(400).send(ServerErrors.OTP_INVALID);
      }
      family = family[0];
      if (kid.length === 0) {
        const OTP = createOTP();
        const smsSent = await kidRegistrationSMS(
          family.name,
          parentPhone,
          firstName,
          OTP,
          false
        );
        if (smsSent) {
          const SQL = `insert into users 
          (email,f_name,l_name,user_type,family_id,otp,otp_trys)
           values 
          (:kid_email,:firstName,:lastName,"kid_temporary",${family.id},${OTP},1)`;
          await this.sequelize.query(SQL, {
            replacements: { kid_email, firstName, lastName },
            type: QueryTypes.INSERT,
          });
          return res.status(200).send(ServerMessages.API_BASE_UPDATE_SUCCESS);
        } else {
          return res.status(400).send(ServerErrors.GENERAL_ERROR);
        }
      } else {
        //kid allredy exist
        kid = kid[0];
        if (kid.is_active !== 1) {
          return res.status(400).send(ServerErrors.GENERAL_ERROR);
        }
        if (kid.is_register) {
          await kidRegistrationSMS(
            family.name,
            parentPhone,
            firstName,
            null,
            false
          );

          const token = createJwtToken(kid.email);
          return res.status(200).send(token);
        } else {
          if (
            kid.otp_trys >= 3 &&
            kid.last_otp > now() - config.otpTimeLimitSeconds
          ) {
            return res.status(400).send(ServerErrors.OTP_EXPIRED);
          } else {
            const OTP = createOTP();
            const smsSent = await kidRegistrationSMS(
              family.name,
              parentPhone,
              firstName,
              OTP,
              true
            );
            if (OTP) {
              const SQL = `update users set otp=:OTP,otp_trys=otp_trys+1 where id=${kid.id}`;
              await this.sequelize.query(SQL, {
                type: QueryTypes.UPDATE,
              });
              return res
                .status(200)
                .send(ServerMessages.API_BASE_UPDATE_SUCCESS);
            } else {
              return res.status(400).send(ServerErrors.GENERAL_ERROR);
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR,
      });
    }
  };

  // POST /api/kid/confirmCode
  confirmCode = async (req, res) => {
    console.log("At kid confirmCode controller");
    try {
      const { phone, otp, email } = req.body;
      if (!phone || !otp || !email) {
        return res.status(400).send(ServerErrors.API_BASE_CREATE_INVALID);
      }

      email = getFixedValue(email);
      otp = getFixedValue(otp);
      phone = getFixedValue(phone);
      let SQL = `select distinct * from users where  email=:email and user_type="kid" and is_active=1  and otp=:otp and last_otp>now()-interval ${config.confirmationCodeLimit} minute`;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT,
      });

      if (kid.length === 0) {
        return res.status(400).send(ServerErrors.OTP_INVALID);
      }
      kid = kid[0];
      SQL = `update users set is_register=1,otp_trys=0,user_type="kid" where id=${kid.id}`;
      await this.sequelize.query(SQL, {
        type: QueryTypes.UPDATE,
      });

      // if device_id for kid id not exist at kid_devices table, add
      SQL = `select distinct * from kid_devices where kid_id=:kid_id`;
      let kidDevice = await this.sequelize.query(SQL, {
        replacements: { kid_id: kid.id },
        type: QueryTypes.SELECT,
      });
      if (kidDevice.length === 0) {
        SQL = `insert into kid_devices (kid_id,device_id) values (:kid_id,:device_id)`;
        await this.sequelize.query(SQL, {
          replacements: { kid_id: kid.id, device_id: req.deviceId },
          type: QueryTypes.INSERT,
        });
      }
      const token = createJwtToken(kid.email);
      return res.status(200).json({ token: token });
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