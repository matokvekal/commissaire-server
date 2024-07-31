import ControllerParents from "../../controllers/parent/controllerParents.js";

export default (router, app) => {
  const modelBase = "parent";
  const parentsController = new ControllerParents(app, modelBase);

  //POST api/parent/token
  router.post(
    `/${modelBase}/token`,
    parentsController.googleToken.bind(parentsController)
  );
  //GET /api/parent/kids
  router.get(
    `/${modelBase}/kids`,
    parentsController.getKids.bind(parentsController)
  );
  //GET api/parent/kidsbydevices
  router.get(
    `/${modelBase}/kidsbydevices`,
    parentsController.getKidsByDevices.bind(parentsController)
  );

  //GET /api/parent/limits
  router.get(
    `/${modelBase}/limits/:id`,
    parentsController.getLimits.bind(parentsController)
  );

  //POST /api/parent/limits
  router.post(
    `/${modelBase}/limits`,
    parentsController.postLimits.bind(parentsController)
  );

  //GET /api/parent/kidsusage
  router.get(
    `/${modelBase}/kidsusage`,
    parentsController.getUsage.bind(parentsController)
  );

  //GET /api/parent/kidsdeviceusage
  router.get(
    `/${modelBase}/kidsdeviceusage`,
    parentsController.KidsUsageByDevices.bind(parentsController)
  );
};
