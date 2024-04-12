import kidsRoutes from "../routes/kid/index.js";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(kidsRoutes).forEach((k) => {
    kidsRoutes[k](router, app);
  });
};
