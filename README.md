connect to server
ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis

MONGO DB -
the code is redy to use mongo db, we just have to install it at aws (prffer to use it at other dick since it take resources
) the update the config use mongo to true; and run
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
///////////////////
NGINX
sudo apt search nginx
sudo systemctl enable nginx
sudo systemctl status nginx
cd /etc/nginx/sites-available
at AWS open port 80/443 with http https
https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-22-04

lidor 9 00:46:15 remove \_ for all file and insert domain
//////this is the version to build the PWA

//////////////////////
hadle Apps problem
at kids:
1.remove kid post apps
2.addcolumn new defaullt = 1 to  kid_aps
3.at first kid registration all aps status=neutral and all new=1
4.run loop until  all apps.new = 0 
every 10 seconds call updateApp >the only change is that you will also get the new. if new=0 then its on the loop else remove it

5.after all apps.new=0  keep the same

====================================
at parent web

also use the new column
at fetchKidApps >>
change   if ((now - lastFetchTime < twentyFourHours)||(apps.filter(app=>app.new===1))) {
        apps = await getAppsFromDb();
      } 

כלומר
שליפה מDB תהיה  כל עוד יש לפחות אפליקציה אחת בסטסטוס חדש
---------------------------------
סיכום
הילד בפעם הראונשה מעביר את כל האפליקציות למצב חדש ולסטטוס ניוטרל
כל עוד יש לו אפליקציות במצב חדש הילד כל עשר שניות משתמש ב updateapp ועובר אחת אחד
אאם הוא מקבל סטטוס ומקבל עדכון לשדה new
אז מעדכן וממשיך ככה עד שמסיים את האפליקציות 
זהו מצב חד פעמי

ההורה
אין עדכון אוטומטי
אלא שבכל פעם שמשנה דף
כל עוד יש לו אפליקציות במצב NEW
הוא ילד לשרת למשוך

השרת
מבטל את APPS POST
יקבל את אפליקציות הילדים דרך UPDATEAPPS
אם האפליקציה עם  
NEW=0
יחזיר לילד פרטים מעודכנים
אחרת חוזר NEW=1
