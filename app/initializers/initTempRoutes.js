import tempRoutes from "../routes/temp/index.js";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(tempRoutes).forEach((k) => {
    tempRoutes[k](router, app);
  });
};
