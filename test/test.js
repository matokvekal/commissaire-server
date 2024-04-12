import express from "express";
import bodyParser from "body-parser";
import { assert } from "chai";
import request from "supertest";
import sinon from "sinon";
import AuthenticationController from "./app/controllers/kid/AuthenticationController";

// Create a new express application
const app = express();
app.use(bodyParser.json());
// Mock the dependencies of AuthenticationController
const appMock = {}; // Mock if needed
const modelNameMock = "User"; // Mock as required
// Instantiate the controller with mocked dependencies
const controller = new AuthenticationController(appMock, modelNameMock);
// Stub the sequelize methods used in the register function
sinon.stub(controller, "sequelize").value({
  query: sinon.stub().resolves([{ id: 1 }]), // Mock the behavior of sequelize.query
});
// Add the route that uses the controller method
app.post("/api/kid/register", controller.register.bind(controller));

describe("POST /api/kid/register", function () {
  it("should return 400 if googleToken or phone is missing", function (done) {
    request(app)
      .post("/api/kid/register")
      .send({ firstName: "John", lastName: "Doe" }) // Missing googleToken and phone
      .expect(400)
      .end(function (err, res) {
        assert.equal(res.text, "Google token and phone number are required.");
        done(err);
      });
  });

  // More tests here...
});

// import { assert } from 'assert';
// describe('Array', function () {
//   describe('#indexOf()', function () {
//     it('should return -1 when the value is not present', function () {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });
