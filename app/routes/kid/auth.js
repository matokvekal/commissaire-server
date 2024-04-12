import AuthenticationController from "../../controllers/kid/authenticationController.js";

export default (router, app) => {
  const modelBase = "kid";
  const authenticationController = new AuthenticationController(app, modelBase);

  // GET /api/kid/register
  router.post(`/${modelBase}/register`, authenticationController.register);

};

//import ControllerKids from "../../controllers/kid/controllerKids.js";

//export default (router, app) => {
//const modelBase = "kid";
//const kidsController = new ControllerKids(app, modelBase);

// GET /api/kid/sayhi
// router.get(`/${modelBase}/sayhi`, kidsController.hello.bind(kidsController));/
//};
