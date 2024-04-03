import ControllerParents from "../controllers/controllerParents.js";

export default (router, app) => {
  const modelBase = "parents";
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
