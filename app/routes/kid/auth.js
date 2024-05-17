import AuthenticationController from "../../controllers/kid/authenticationController.js";

export default (router, app) => {
  const modelBase = "kid";
  const authenticationController = new AuthenticationController(app, modelBase);

  //Post /api/kid/login
  router.post(`/${modelBase}/login`, authenticationController.login);

  // GET /api/kid/register
  router.post(`/${modelBase}/register`, authenticationController.register);

  // POST /api/kid/confirmcode
  router.post(
    `/${modelBase}/confirmcode`,
    authenticationController.confirmCode
  );
  //POST /api/kid/simulateJwtToken
  router.post(
    `/${modelBase}/simulatejwttoken`,
    authenticationController.simulatejwttoken
  );
};

//import ControllerKids from "../../controllers/kid/controllerKids.js";

//export default (router, app) => {
//const modelBase = "kid";
//const kidsController = new ControllerKids(app, modelBase);

// GET /api/kid/sayhi
// router.get(`/${modelBase}/sayhi`, kidsController.hello.bind(kidsController));/
//};
