import axios from "axios";
import config from "../config/index.js";
const sendSms = true;

export const kidRegistrationSMS = async (
  name,
  phoneNumber,
  kidName,
  otp,
  isLogin = false
) => {
  const action = isLogin ? "login" : "register";
  otp = otp ? `Your OTP is ${otp}.` : "";
  const messageBody = ` Hi,  ${otp}  is the Otp for ${kidName} to KoaliTime app `;
  const smsSender = config.smsSenderName;
  const result = await singleSmsSender(phoneNumber, messageBody, smsSender);
  return result;
};

export const parentRegistrationSMS = async (phoneNumber, otp) => {
  const messageBody = `Your OTP :${otp}  welcome to  Koali Time `;
  const smsSender = config.smsSenderName;
  const result = await singleSmsSender(phoneNumber, messageBody, smsSender);
  return result;
};

export const singleSmsSender = async (
  phoneNumber,
  messageBody,
  sender = config.smsSenderName
) => {
  try {
    const token = config.SMS_API_TOKEN;
    const url = config.sms_api_url;
    const Active = config.sms_is_active === "true" ? true : false;
    let sendSmsResult;

    if (Active) {
      const Users = [{ Phone: phoneNumber }];
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Basic  ${token}`,
      };
      const body = {
        Message: messageBody,
        Recipients: Users,
        Settings: {
          Sender: sender,
        },
      };
      if (sendSms) {
        sendSmsResult = await axios.post(url, body, { headers });
      } else {
        console.error("SMS not sent");
        return true;
      }
      const success = sendSmsResult.statusText;
      return success;
    }
    return false;
  } catch (err) {
    console.error("Problem with SMS sender:", err.message);
    return false;
  }
};

export default kidRegistrationSMS;
