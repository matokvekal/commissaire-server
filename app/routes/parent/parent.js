import ControllerParents from "../../controllers/parent/controllerParents.js";

export default (router, app) => {
  const modelBase = "parent";
  const parentsController = new ControllerParents(app, modelBase);

  router.get(
    `/${modelBase}/sayhi`,
    parentsController.hello.bind(parentsController)
  );

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
  // router.post(
  // 	`/${modelBase}/uploadPassengersFile`,
  // 	ParentsController.uploadPassengersFile.bind(ParentsController)
  // );
};
