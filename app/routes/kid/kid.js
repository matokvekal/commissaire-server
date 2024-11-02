import ControllerKids from "../../controllers/kid/controllerKids.js";

export default (router, app) => {
  const modelBase = "kid";
  const kidsController = new ControllerKids(app, modelBase);

  //POST api/kid/convertminutes
  router.post(
    `/${modelBase}/convertminutes`,
    kidsController.convertMinutes.bind(kidsController)
  );

  //put /api/kid/converdiamonds?amount=10 but can be also without amount
  //convertDiamonds = async (req, res) => {
  router.put(
    `/${modelBase}/converdiamonds`,
    kidsController.convertDiamonds.bind(kidsController)
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
  //GET  /api/kid/diamonds
  router.get(
    `/${modelBase}/diamonds`,
    kidsController.getDiamonds.bind(kidsController)
  );

  //POST /api/kid/usage
  router.post(`/${modelBase}/usage`, kidsController.usage.bind(kidsController));

  //POST /api/kid/appusage
  router.post(
    `/${modelBase}/usage`,
    kidsController.appUsage.bind(kidsController)
  );

  //POST api/kid/position
  router.post(
    `/${modelBase}/usage`,
    kidsController.position.bind(kidsController)
  );
  //POST api/kid/updateapp
  router.post(
    `/${modelBase}/updateapp`,
    kidsController.updateApp.bind(kidsController)
  );

  //put /api/kid/converdiamonds?amount=10
  router.put(
    `/${modelBase}/converdiamonds`,
    kidsController.convertDiamonds.bind(kidsController)
  );
};
