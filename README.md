connect to server
ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis

at aws we have instaled mong
mongo -u "admin" -p "Aa1234567" --authenticationDatabase "admin"

/etc/mongod.conf
security:
authorization: enabled
then run
sudo systemctl restart mongod
at comaps connect with:
mongodb://admin:Aa1234567@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com:27017/?authSource=admin&authMechanism=SCRAM-SHA-256&tls=false

To create an administrative user in MongoDB, you'll need to use the MongoDB shell to execute the command you mentioned, with some modifications to include your actual username and password. Here's a step-by-step guide on how to do it:

Step 1: Access MongoDB Shell
First, you need to access the MongoDB shell. You can do this by entering the following command in your terminal:

bash
Copy code
mongo
Step 2: Switch to the Admin Database
Once in the MongoDB shell, switch to the admin database, which is the default database for storing system-wide information like users and roles:

use admin
db.createUser({
user: "<username>",
pwd: "<password>",
roles: [{role: "root", db: "admin"}]
}

show users

.env
this file shuld be at /home/ubuntu/env./env , the ci will make simblic link to project

log error
import { createErrorLog } from "../utils/apiLoggerUtils.js";
await createErrorLog(db, req, error);

test to be done
1.register with i agree parent
2.register with i agree kid
3.POST /api/parent/token
4.POST /api/kid/token 5. POST /api/kid/apps 5. POST /api/kid/device
