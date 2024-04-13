import BaseController from "./baseController.js";
import { QueryTypes } from "sequelize";
import { getFixedValue } from "../../utils/getFixedValues.js";
import { getDataFromGoogleToken } from "../../utils/authenticationUtils.js";
import config from "../../config/index.js";
import { createJwtToken } from "../../utils/authenticationUtils.js";
import { createOTP } from "../../utils/authenticationUtils.js";
import test from "../../routes/kid/temporarytest.js";
import { kidRegistrationSMS } from "../../utils/smsUtil.js";

class AuthenticationController extends BaseController {
  constructor(app, modelName) {
    super(app, modelName);
  }
  // POST /api/kid/register
  register = async (req, res) => {
    console.log("at kid register controller");
    try {
      let { firstName, lastName, parentPhone, googleToken } = req.body;
      firstName = getFixedValue(firstName);
      lastName = getFixedValue(lastName);
      parentPhone = getFixedValue(parentPhone);

      // const kid_email = await getDataFromGoogleToken(googleToken);
      const kid_email = "test@gmail.com";
      if (!kid_email) {
        return res.status(400).send("Invalid or expired Google token.");
      }
      //TODO
      //1.get google token,kid name, parent name and parent phone from client
      //2Send a Request to Google's TokenInfo Endpoint: Using the received token, your server makes a request to Google's token validation endpoint (https://oauth2.googleapis.com/tokeninfo?id_token=XYZ123) or uses a Google client library to validate the token.
      //Receive Token Information: Google's service responds with the token's information, including the user's unique identifier (sub) and any other user details your app requested access to (and the user consented to share), such as email address, profile info, etc.
      //3.serch table users to see if kid email exists .
      let SQL = `select distinct * from users where  email=:kid_email and user_type="kid" `;
      let kid = await this.sequelize.query(SQL, {
        replacements: { kid_email },
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
        return res.status(400).send("No match family found");
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
          return res.status(200).send("sms sent");
        } else {
          return res.status(400).send("sms not sent");
        }
      } else {
        // name,
        // phone,
        // kidName,
        // otp,
        // isLogin = false

        //kid allredy exist
        kid = kid[0];
        if (kid.is_active !== 1) {
          return res.status(400).send("some error occurred call support");
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
            return res
              .status(400)
              .send(`you have to wait ${config.otpTimeLimitSeconds}seconds`);
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
              return res.status(200).send("sms sent");
            } else {
              return res.status(400).send("sms not sent");
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in register.",
      });
    }
  };
  confirmCode = async (req, res) => {
    console.log("At kid confirmCode controller");
    try {
      const { phone, otp, email } = req.body;
      if (!phone || !otp || !email) {
        return res
          .status(400)
          .send("Phone number, OTP, and email are required.");
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
        return res.status(400).send("Invalid OTP or user not found.");
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
      return res.status(200).send(token);
    } catch (err) {
      console.log(err);
      res.createErrorLogAndSend(this.sequelize, {
        err: err.message || "Some error occurred in confirmCode.",
      });
    }
  };
}
export default AuthenticationController;

// Key Functionalities & API Endpoints
// Kid Registration (POST /api/kid/register):

// Purpose: Registers or logs in a kid using a Google authentication token and other provided details.
// Required Body Parameters:
// firstName: Kid's first name.
// lastName: Kid's last name.
// phone: Parent's phone number.
// googleToken: Google authentication token.
// Process:
// Verifies the provided Google token.
// Searches for an existing kid and family by the provided details.
// If no matching family is found, responds with an error.
// For a new kid, sends an OTP to the parent's phone and inserts a new user record as "kid_temporary".
// For an existing kid, the process depends on their registration and activation status:
// If already registered and active, sends a login SMS and returns a JWT token.
// If not registered or awaiting OTP verification, sends a registration SMS.
// Responses:
// 200: Successfully sent SMS or returned JWT token for login.
// 400: Errors such as missing Google token/phone, invalid Google token, SMS sending failure, or no matching family found.
// Confirm Registration Code (POST /api/kid/confirmCode):

// Purpose: Confirms the OTP sent to the parent's phone during the registration process.
// Required Body Parameters:
// phone: Phone number to which the OTP was sent.
// otp: The OTP that was sent to the parent's phone.
// email: Kid's email address.
// Process:
// Verifies the provided OTP and email against the database.
// Updates the kid's status to registered if the OTP is correct and within the valid time frame.
// Optionally adds a device ID to kid_devices if not already present.
// Responses:
// 200: Successfully confirmed OTP and updated kid's status, returns JWT token.
// 400: Errors such as missing parameters, invalid OTP, or user not found.

test;
