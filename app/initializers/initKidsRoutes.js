import routes from "../routes/index.js";

export default (router, app) => {
  // Generates router initiation for each imported routing
  Object.keys(routes).forEach((k) => {
    routes[k](router, app);
  });
};
