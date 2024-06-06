import ControllerKids from "../../controllers/kid/controllerKids.js";

export default (router, app) => {
  const modelBase = "kid";
  const kidsController = new ControllerKids(app, modelBase);

  //POST /api/kid/apps
  router.post(
    `/${modelBase}/apps`,
    kidsController.kidApps.bind(kidsController)
  );

  // POST /api/kid/device
  router.post(
    `/${modelBase}/device`,
    kidsController.registerDevice.bind(kidsController)
  );


  //POST api/kid/token
  router.post(
    `/${modelBase}/token`,
    kidsController.googleToken.bind(kidsController)
  );


  //Get /api/kid/apps
  router.get(`/${modelBase}/apps`, kidsController.getApps.bind(kidsController));

  //GET /api/kid/limits
  router.get(
    `/${modelBase}/limits`,
    kidsController.limits.bind(kidsController)
  );

  //POST /api/kid/usage
  router.post(`/${modelBase}/usage`,
  kidsController.usage.bind(kidsController));

  
};
