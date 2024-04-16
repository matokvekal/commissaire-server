import AuthController from "../../controllers/parent/authController.js";

export default (router, app) => {
  const modelBase = "parent";
  const authController = new AuthController(app, modelBase);
  // POST /api/parent/register
  router.post(`/${modelBase}/register`, authController.register);

  // POST /api/parent/confirm
  router.post(`/${modelBase}/confirm`, authController.confirm);
};
