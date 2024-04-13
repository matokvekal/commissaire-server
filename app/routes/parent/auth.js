import AuthenticationController from "../../controllers/parent/authenticationController.js";

export default (router, app) => {
  const modelBase = "parent";
  const authenticationController = new AuthenticationController(app, modelBase);
  // POST /api/parent/register
  router.post(`/${modelBase}/register`, authenticationController.register);

  // POST /api/parent/confirm
  router.post(`/${modelBase}/confirm`, authenticationController.confirm);
};
