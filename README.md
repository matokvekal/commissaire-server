to add .env  
 echo "${{secrets.STAGING_ENV}}" >.env
use the github secrets
as https://www.youtube.com/watch?v=cgWXQqL-ZU8

connect to server
$ ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis

.env
this file shuld be at /home/ubuntu/env./env , the ci will make simblic link to project
