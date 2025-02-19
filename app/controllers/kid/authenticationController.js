import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import config from "../../config/index.js";
import { kidRegistrationSMS } from "../../utils/smsUtil.js";
import { verifyIdToken, getUserData } from "../../utils/fireBaseAuthUtil.js"; // Import Firebase utilities
import { createJwtToken, createOTP } from "../../utils/authenticationUtils.js";
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
import {
  ServerMessages,
  ServerErrors,
  ServerLoginMessages
} from "../../constants/constantMessages.js";

import moment from "moment";
class AuthenticationController extends BaseController {
  constructor(app, modelName) {
    super(app, modelName);
  }

  // Post /api/kid/login
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
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
      }
      const { email } = getUserData(decodedToken);
      if (!email) {
        console.log("no email kid login");
        res.createErrorLogAndSend(this.sequelize, {
          err: "Some error occurred in kid login 1."
        });
      }
      console.log(
        "email: ",
        email,
        " valid",
        valid,
        "decodedToken",
        decodedToken,
        "error",
        error
      );
      await createSingleLog(
        email,
        this.sequelize,
        req,
        `valid ${valid};error ${error} `,
        "/kid/login"
      );

      let SQL = `select distinct * from users where  email=:email and user_type="kid" `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT
      });
      if (kid.length === 0) {
        console.log("kid.length === 0");
        return res.status(206).send(ServerErrors.NOT_REGISTERED);
      }
      kid = kid[0];
      if (kid.is_active !== 1) {
        console.log("kid.is_active !== 1");
        return res.status(400).send(ServerErrors.CONTACT_ADMIN);
      }
      if (!kid.is_register) {
        console.log("!kid.is_register");
        return res.status(206).send(ServerErrors.NOT_REGISTERED);
      }
      SQL = `select distinct * from family where id=:family_id and is_active=1`;
      let family = await this.sequelize.query(SQL, {
        replacements: { family_id: kid.family_id },
        type: QueryTypes.SELECT
      });
      if (family.length === 0) {
        console.log("family.length === 0");
        return res.status(400).send(ServerErrors.FAMILY_NOT_EXIST);
      }
      family = family[0];
      const phoneNumber = family.parent_phone;
      if (!phoneNumber) {
        console.log("!phoneNumber");
        return res.status(400).send(ServerErrors.FAMILY_NOT_EXIST);
      }
      //TODO
      //change this code to send Email instead of sms in case sms failer
      const token = createJwtToken(kid.email, "kid");
      return res
        .setHeader("Authorization", `Bearer ${token}`)
        .status(200)
        .send(ServerMessages.AUTHORIZATION_SUCCESS);
    } catch (err) {
      console.error("Error: ", err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in login "
      });
    }
  };

  // POST /api/kid/register
  register = async (req, res) => {
    const MAX_OTP_ATTEMPTS = 3;
    console.log("at kid register controller");
    try {
      let { firstName, parentPhone, googleToken, readAndAgreeTerms } = req.body;

      if (!googleToken || !firstName || !parentPhone || !readAndAgreeTerms) {
        console.log("register MISSING_DETAILS");
        return res.createErrorLogAndSend(this.sequelize, {
          code: "MISSING_DETAILS",
          status: 400
        });
      }
      firstName = getFixedValue(firstName);
      parentPhone = getFixedValue(parentPhone);
      console.log("at kid register controller googleToken", googleToken);
      const { valid, decodedToken, error } = await verifyIdToken(googleToken);
      if (!valid) {
        console.log("Failed to verify token:", error.message || error);
        return res.createErrorLogAndSend(this.sequelize, {
          err: error,
          code: "INVALID_GOOGLE_TOKEN",
          status: 401
        });
      }
      const { email, uid, name, picture, phone_number } =
        getUserData(decodedToken);

      if (!email) {
        console.log("no email kid register email:", email);
        return res.createErrorLogAndSend(this.sequelize, {
          code: "SOME_ERROR_OCCURRED",
          status: 400
        });
      }
      await createSingleLog(
        email,
        this.sequelize,
        req,
        `parentPhone ${parentPhone} email:${email}`,
        "/kid/register"
      );
      let SQL = `select  * from users where  email=:email and ( user_type="kid" or user_type="kid_temporary") `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email: email },
        type: QueryTypes.SELECT
      });

      if (kid.length > 0) {
        kid = kid[0];
        if (kid.is_active === 0) {
          console.error("Error kid is not active");
          return res.status(400).send(ServerErrors.CONTACT_ADMIN);
        } else if (
          kid.otp_trys >= MAX_OTP_ATTEMPTS &&
          moment(kid.last_otp).isAfter(
            moment().subtract(config.otpConfirmationLimitsMinutes, "minutes")
          )
        ) {
          return res.createErrorLogAndSend(this.sequelize, {
            code: "TOO_MANY_TRIES",
            status: 400
          });
        }
      }

      SQL = `select distinct  * from family where  parent_phone=:parentPhone and is_active=1  `;
      let family = await this.sequelize.query(SQL, {
        replacements: { parentPhone },
        type: QueryTypes.SELECT
      });
      console.log("family data", family);
      if (family.length === 0) {
        console.error(`ServerErrors.FAMILY_NOT_EXIST`);
        return res.createErrorLogAndSend(this.sequelize, {
          code: "FAMILY_NOT_EXIST",
          status: 400
        });
      }

      family = family[0];
      let OTP = createOTP();
        //this is petch from 19-2-25 remove it  if you manage the sms support
        OTP="1234";
      //end of petch
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
                  (:email,:firstName,'${family.name}','kid_temporary',${family.id},${OTP},1,UTC_TIMESTAMP(),'${uid}', '${name}', '${picture}',1)`;
          await this.sequelize.query(SQL, {
            replacements: { email, firstName },
            type: QueryTypes.INSERT
          });
          return res.status(205).send(ServerMessages.OTP_SENT_SUCCESS);
        } else {
          SQL = `update users set otp=${OTP},otp_trys=otp_trys+1,last_otp=UTC_TIMESTAMP() where id=${kid.id}`;
          await this.sequelize.query(SQL, {
            type: QueryTypes.UPDATE
          });
          return res.status(205).send(ServerMessages.OTP_SENT_SUCCESS);
        }
      } else {
        return res.createErrorLogAndSend(this.sequelize, {
          code: "SMS_FAILED",
          status: 400
        });
      }
    } catch (err) {
      console.error(err);
      return res.createErrorLogAndSend(this.sequelize, {
        err,
        code: "GENERAL_ERROR",
        status: 500
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
        console.error("Failed to verify token:", error.message || error);
        // return res.status(401).send(ServerErrors.INVALID_GOOGLE_TOKEN);
        res.createErrorLogAndSend(this.sequelize, {
          err: "Some error occurred in confirmCode kid.1"
        });
      }
      const { email } = getUserData(decodedToken);

      if (!email) {
        // return res.status(400).send(ServerErrors.SOME_ERROR_OCCURRED);
        res.createErrorLogAndSend(this.sequelize, {
          err: "Some error occurred in confirmCode kid.2"
        });
      }

      await createSingleLog(
        email,
        this.sequelize,
        req,
        `otp: ${otp} email: ${email}`,
        "/kid/confirmCode"
      );

      let SQL = `select distinct * from users where  email=:email and ( user_type="kid" or user_type="kid_temporary") and is_active=1  and otp=${otp} and last_otp > UTC_TIMESTAMP()-interval ${config.otpConfirmationLimitsMinutes} minute`;
      let kid = await this.sequelize.query(SQL, {
        replacements: { email },
        type: QueryTypes.SELECT
      });

      if (kid.length === 0) {
        console.log("Invalid OTP");
        return res.status(405).send("Error, kid not exist");
      }
      kid = kid[0];
      //check if kid.otp.toString() === otp.toString()
      if (kid.otp.toString() !== otp.toString()) {
        return res.status(405).send(ServerErrors.INVALID_OTP);
      }

      SQL = `update users set is_register=1,otp_trys=0,user_type="kid" where id=${kid.id}`;
      await this.sequelize.query(SQL, {
        type: QueryTypes.UPDATE
      });

      SQL = "select id,type from device_types where is_active=1";
      const devices = await this.sequelize.query(SQL, {
        type: QueryTypes.SELECT
      });
      console.log("devices", devices);
      const token = createJwtToken(kid.email, "kid");
      res.setHeader("Authorization", `Bearer ${token}`);
      return res.status(200).json({ devices: devices });
    } catch (err) {
      console.error(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || ServerErrors.GENERAL_ERROR
      });
    }
  };
}
export default AuthenticationController;
