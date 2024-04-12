import axios from "axios";
import config from "../config/index.js";
const sendSms = false;

// const sendSms = async (Recipients = [], messageBody) => {
//   try {
//     const token = config.smsToken;
//     const url = config.smsUrl;

//     const siteID = config.siteID;
//     const password = config.smsSitePassword;

//     // const tokenResult = await axios.post(
//     //   "<TOKEN_VERIFICATION_URL>", // Missing URL for token verification
//     //   { siteID, password }
//     // );
//     // const { Active } = tokenResult.data.ActiveToken;

//     const Active = true;

//     if (Active) {
//       // Properly structure the Recipients array for the payload
//       const Users = Recipients.map((phoneNumber) => ({ Phone: phoneNumber }));

//       // Fix data payload and axios post request structure
//       const sendSmsResult = await axios.post(
//         url,
//         {
//           Message: messageBody,
//           Recipients: Users, // Directly use the mapped Users array
//           Settings: {
//             Sender: "Koali Time",
//           },
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`, // Assuming Bearer token, adjust accordingly
//           },
//         }
//       );

//       // Assuming your API returns a success flag, adjust based on actual API response structure
//       const { success } = sendSmsResult.data;
//       return success;
//       // return true; // Uncomment if you need to bypass actual sending for testing
//     }
//     return false;
//   } catch (err) {
//     console.error("Problem with SMS sender:", err.message);
//     return false;
//   }
// };
export const sendRegistrationSMS = async (
  name,
  phoneNumber,
  kidName,
  otp,
  isLogin = false
) => {
  const action = isLogin ? "login" : "register";
  otp = otp ? `Your OTP is ${otp}.` : "";
  const messageBody = `Your kid ${kidName} just ${action} to KoaliTime app ${otp}`;
  const smsSender = config.smsSenderName;
  const result = await singleSmsSender(phoneNumber, messageBody, smsSender);
  return result;
};

const singleSmsSender = async (phoneNumber, messageBody, sender) => {
  try {
    const token = config.SMS_API_TOKEN;
    const url = config.sms_api_url;
    const Active = config.sms_is_active === "true" ? true : false;

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
        const sendSmsResult = await axios.post(url, body, { headers });
      } else {
        console.log("SMS not sent");
        return true;
      }
      const { success } = sendSmsResult.data;
      return success;
    }
    return false;
  } catch (err) {
    console.error("Problem with SMS sender:", err.message);
    return false;
  }
};

export default sendRegistrationSMS;
