to add .env  
 echo "${{secrets.STAGING_ENV}}" >.env
use the github secrets
as https://www.youtube.com/watch?v=cgWXQqL-ZU8

connect to server
$ ssh -i "C:\\ssh\koali-key-24.pem" ubuntu@ec2-18-199-57-38.eu-central-1.compute.amazonaws.com

at aws the server at :
/home/ubuntu/actions-runner-api/\_work/apis/apis


TODO
Feature: Kid Registration Process

Client Submission:

Kid's app sends a registration request including Google token, kid's name, parent's phone number, and family name.
Server-side (POST API /registration):

Extract Email: Retrieve the kid's email from the Google token.
Search for Kid in Families:
If the kid is found in any family (indicating prior registration), proceed to send an OTP to the parent.
Limit OTP generation to no more than 3 times within 20 minutes. If exceeded, instruct to wait 20 seconds before retrying.
OTP Verification:
The system awaits the kid's OTP submission (sent to the parent) for 20 seconds before expiration.
Upon receiving and validating the OTP, along with the kid's Google token, the kid is considered registered/logged in.
A JWT token, valid for 1 year, is issued to the kid.
New Kid Registration:
If the kid is not found in any family, attempt to locate the parent by the phone number provided.
If the parent is not found, notify the kid that no match was found.
If the parent is found, create a temporary kid record under this parent and initiate the OTP process as before.
Cleanup:

Periodically, a background process removes temporary kid records that have not completed registration.