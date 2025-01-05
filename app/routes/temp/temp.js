import TempController from "../../controllers/temp/tempController.js";

export default (router, app) => {
  const modelBase = "temp";
  const tempController = new TempController(app, modelBase);

  GET / api / temp / log;
  router.get(`/${modelBase}/log`, tempController.hello1.bind(tempController));
  // GET /api/temp/hello2
  router.get(
    `/${modelBase}/hello2`,
    tempController.hello2.bind(tempController)
  );
  // GET /api/temp/token?id=  working and save at demo_tokens
  router.get(
    `/${modelBase}/token`,
    tempController.simulateJwtToken.bind(tempController)
  );
  // GET /api/temp/add_kid?phone=
  router.get(
    `/${modelBase}/add_kid`,
    tempController.addKid.bind(tempController)
  );

  router.get(
    `/${modelBase}/delete_kid`,
    tempController.deleteKid.bind(tempController)
  );

  return router;
};
