import ControllerKids from "../../controllers/kid/controllerKids.js";

export default (router, app) => {
  const modelBase = "kid";
  const kidsController = new ControllerKids(app, modelBase);

  // GET /api/kid/sayhi
  router.get(`/${modelBase}/sayhi`, kidsController.hello.bind(kidsController));

  // GET /api/kid/simulatejwttoken
  router.get(
    `/${modelBase}/simulatejwttoken`,
    kidsController.simulateJwtToken.bind(kidsController)
  );
};
