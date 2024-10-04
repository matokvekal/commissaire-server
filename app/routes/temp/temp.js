import TempController from "../../controllers/temp/tempController.js";

export default (router, app) => {
  const modelBase = "temp";
  const tempController = new TempController(app, modelBase);

  // GET /api/temp/hello1
  router.get(
    `/${modelBase}/hello1`,
    tempController.hello1.bind(tempController)
  );
  // GET /api/temp/hello2
  router.get(
    `/${modelBase}/hello2`,
    tempController.hello2.bind(tempController)
  );

  // GET /api/temp/simulatejwttoken
  router.get(
    `/${modelBase}/simulatejwttoken`,
    tempController.simulateJwtToken.bind(tempController)
  );

  //POST /api/temp/simulatejwttoken
  router.post(
    `/${modelBase}/simulatejwttoken`,
    tempController.simulatejwttoken
  );



 
};
