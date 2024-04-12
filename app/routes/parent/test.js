import ControllerParents from "../../controllers/parent/controllerParents.js";

export default (router, app) => {
  const modelBase = "parent";
  const parentsController = new ControllerParents(app, modelBase);

  router.get(
    `/${modelBase}/sayhi`,
    parentsController.hello.bind(parentsController)
  );
  // router.post(
  // 	`/${modelBase}/uploadPassengersFile`,
  // 	ParentsController.uploadPassengersFile.bind(ParentsController)
  // );
};
