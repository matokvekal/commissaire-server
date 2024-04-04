import ControllerKids from "../controllers/controllerKids.js";

export default (router, app) => {
  const modelBase = "kids";
  const kidsController = new ControllerKids(app, modelBase);

  // GET /api/kids/sayhi
  router.get(`/${modelBase}/sayhi`, kidsController.hello.bind(kidsController));
  router.post(
    `/${modelBase}/uploadPassengersFile`,
    customersController.uploadPassengersFile.bind(customersController)
  );
};
