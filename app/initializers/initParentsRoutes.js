import parentsRoutes from "../routes/parent/index.js";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(parentsRoutes).forEach((k) => {
    parentsRoutes[k](router, app);
  });
};
