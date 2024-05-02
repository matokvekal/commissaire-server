connect to server
$ ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis

.env
this file shuld be at /home/ubuntu/env./env , the ci will make simblic link to project

log error
import { createErrorLog } from "../utils/apiLoggerUtils.js";
await createErrorLog(db, req, error);

\
log
import { createSingleLog } from "../../utils/apiLoggerUtils.js";
await createSingleLog(
this.sequelize,
req,
"Hello from kids controller",
"/hello"
);

///TODO
server api

Backend API Tasks (Node.js)
API: Update Kid Apps
Method: POST
Endpoint: /api/kid/apps/update
Description: Allows kids to send their list of apps at login or whenever there is a change.
Payload: { kid_id: int, apps: [{ app_code: string, device_id: int }] }
Actions:
Validate the session and permissions.
Update or insert into kid_apps based on the provided list.
API: Log Total App Usage
Method: POST
Endpoint: /api/kid/usage/log
Description: Allows kids to update the server about their app usage time.
Payload: { kid_id: int, date: string, total_time: int }
Actions:
Validate kid identity.
Log usage to users table or a dedicated usage log table if existing.
API: Get Kid Apps List
Method: GET
Endpoint: /api/kid/apps
Description: Fetch the list of apps with their status for a kid.
Query Parameters: kid_id
Actions:
Validate the request.
Retrieve apps list and their status from kid_apps.
API: Parent Get Kid's Apps
Method: GET
Endpoint: /api/parent/kids/apps
Description: Allows parents to fetch the list of apps associated with their kids.
Query Parameters: parent_id
Actions:
Validate parent's session.
Retrieve all apps under the parent's kid from kid_apps.
API: Update App Status
Method: POST
Endpoint: /api/parent/apps/status
Description: Allows parents to change the status of any app for their kids.
Payload: { app_id: int, new_status: string }
Actions:
Validate parent permissions.
Update the app status in kid_apps.
API: Get Kid Usage Data
Method: GET
Endpoint: /api/parent/kids/usage
Description: Fetch usage data for the parent's kids.
Query Parameters: parent_id
Actions:
Validate the request.
Fetch usage data, possibly aggregating by day or week.
Development Tasks Breakdown
Database Setup: Execute SQL scripts to create necessary tables and modify existing ones.
Backend Development:
Set up the Node.js environment with frameworks like Express.
Develop the APIs as defined, ensuring they interact with the database correctly.
Implement authentication and authorization to secure API endpoints.
Use middleware for logging, error handling, and session management.
Testing:
Write unit and integration tests for each API.
Use Postman or similar tools for endpoint testing.
Deployment:
Set up a production server.
Deploy the application and monitor for performance issues.
