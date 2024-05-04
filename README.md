connect to server
$ ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis

.env
this file shuld be at /home/ubuntu/env./env , the ci will make simblic link to project

log error
import { createErrorLog } from "../utils/apiLoggerUtils.js";
await createErrorLog(db, req, error);

test to be done
1.register with i agree parent
2.register with i agree kid
3.POST /api/parent/token
4.POST /api/kid/token 5. POST /api/kid/apps
5. POST /api/kid/device
