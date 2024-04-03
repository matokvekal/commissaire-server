API Integration Guide

-----APIS for the kid App-----

1)is_kid_and_family_exist API
Purpose: Checks if a kid's family account exists.
Method: POST
Header: Include JWT token for authentication.
{
  "google_token": "<TOKEN>",
  "unique_device_identifier": "<DEVICE_ID>"
}
Responses:
family_exist
family_not_exist (Display: "Ask parent to download the app and register.")
Last update: 34-3-2024. Updated by: Gilad.


2)kid_ask_parent_connection API
Purpose: Initiates connection with the parent's phone for OTP verification.
Method: POST
Header: Include JWT token for authentication.
Payload:
{
  "parent_phone": "<PHONE_NUMBER>",
  "google_token": "<TOKEN>",
  "kid_name": "<NAME>",
  "unique_device_identifier": "<DEVICE_ID>"
}
Responses:
parent_not_exist (Display: "Ask parent to download the app and register.")
wait_for_otp (Server sends an OTP to the parent.)
Last update: 34-3-2024. Updated by: Gilad.


3)otp_validation API
Purpose: Verifies the OTP entered by the kid.
Method: POST
Header: Include JWT token for authentication.
Payload:
{
  "otp": "<OTP_CODE>",
  "google_token": "<TOKEN>",
  "unique_device_identifier": "<DEVICE_ID>"
}
Response: {"status": "ok", "jwt_token": "<JWT_TOKEN>"}
Note: JWT token is provided upon successful OTP verification.
Last update: 34-3-2024. Updated by: Gilad.


4)kid_log API
Purpose: Transmits log entries from the app to the server.
Method: POST
Security: To be implemented. Requires JWT token for authentication.
Payload:
{
  "log_entries": "<JSON_FORMATTED_LOG_ENTRIES>",
  "google_token": "<TOKEN>",
  "unique_device_identifier": "<DEVICE_ID>"
}
Response: {"status": "ok"}
Note: Response is provided upon successful log transmission.
Last update: 34-3-2024. Updated by: Gilad.


5)kid_app_config API
Purpose: Retrieves configuration settings from the server/parent app.
Method: POST
Header: Include JWT token for authentication.
Payload:
{
  "google_token": "<TOKEN>",
  "unique_device_identifier": "<DEVICE_ID>"
}
Responses:
{
  "nightTimeStart": "18:00",
  "dayTimeStart": "07:00",
  "schoolDays": [1, 2, 3, 4, 5],
  "minutesToCallServerAtNight": 300,
  "minutesToCallServerAtDay": 240,
  "listOfForbiddenApps": ["facebook", "abc", "xyz"],
  "allowedMinutesAtSchoolDay": 120,
  "allowedMinutesAtFreeDay": 240
}
Last update: 34-3-2024. Updated by: Gilad.


6)update_usage API
Method: POST
Payload:
{
  "google_token": "<GOOGLE_TOKEN>",
  "device_id": "<DEVICE_ID>",
  "datetime": "<CURRENT_DATETIME_UTC>",
  "usage_data": [
    {
      "app_name": "<APP_NAME>",
      "start_time": "<START_TIME_UTC>",
      "usage_minutes": <USAGE_MINUTES>
    }
  ],
  "total_accumulated_minutes": <TOTAL_ACCUMULATED_MINUTES>
}
Response: {"total_accumulated_minutes": 235}
Note: This can be calculated by the server due to other open devices.
Last update: 34-3-2024. Updated by: Gilad.


-----APIs for the parent app-----

1.parent_register
urpose: Registers a parent's device with the system. The parent must enter their mobile phone number. They are allowed up to 3 attempts; upon exceeding this limit, they must wait 20 seconds before trying again.
Method: POST
Payload:
{ "phone_number": "<PHONE_NUMBER>", "device_id": "<DEVICE_ID>" }

Responses:
Success: {"status": "ok"}
Error (generic): {"status": "error", "message": "<ERROR_MESSAGE>"}
Error (exceeding attempts): {"status": "error", "message": "Exceeded attempts, please wait 20 seconds."}

2)parent_app_config API
Purpose: Retrieves configuration settings from the server for the parent app.
Method: GET
Header: Authorization: Bearer <JWT_TOKEN>
Query Parameter: unique_device_identifier=<DEVICE_ID>
Successful Response:

{
  "status": "ok",
  "config": {
    "nightTimeStart": "18:00",
    "dayTimeStart": "07:00",
    "schoolDays": [1, 2, 3, 4, 5],
    "minutesToCallServerAtNight": 300,
    "minutesToCallServerAtDay": 240,
    "listOfForbiddenApps": ["facebook", "abc", "xyz"],
    "allowedMinutesAtSchoolDay": 120,
    "allowedMinutesAtFreeDay": 240
  }
}
Error Response:
{
  "status": "error",
  "message": "<ERROR_MESSAGE>"
}

Last update: 34-3-2024. Updated by: Gilad


3)Update parent_app_config API
Purpose: Allows parents to update configuration settings on the server for their child's device usage.
Method: POST
Header: Authorization: Bearer <JWT_TOKEN>
Payload:
{
  "unique_device_identifier": "<DEVICE_ID>",
  "config": {
    "nightTimeStart": "18:00",
    "dayTimeStart": "07:00",
    "schoolDays": [1, 2, 3, 4, 5],
    "minutesToCallServerAtNight": 300,
    "minutesToCallServerAtDay": 240,
    "listOfForbiddenApps": ["facebook", "abc", "xyz"],
    "allowedMinutesAtSchoolDay": 120,
    "allowedMinutesAtFreeDay": 240
  }
}
Successful Response:
{
  "status": "ok",
  "message": "Configuration updated successfully."
}
Error Response:
{
  "status": "error",
  "message": "<ERROR_MESSAGE>"
}
Last update: 34-3-2024. Updated by: Gilad.

4) parent_log

Method: POST

Security: To be implemented.

Payload: JSON formatted log entries,device id

Header: Include JWT token for authentication.

Response: Expect an "ok" upon successful receipt.

Log Entry Example:  WE WILL HAVE TO TALK ABOUT THIS !