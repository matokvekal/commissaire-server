import { QueryTypes } from "sequelize";
import sequelize from "../config/sequelize.js"; // Assuming sequelize is set up in a config file

/**
 * Log app actions in the statistic_app table.
 * 
 * @param {string} user - The user performing the action.
 * @param {string} package_name - The package name of the app.
 * @param {number} app_id - The ID of the app.
 * @param {number} device_type - The type of device.
 * @param {string} action - The action performed (add, remove, change).
 */
export function logAppAction(user, package_name, app_id, device_type, action) {
  const SQL = `
    INSERT INTO statistic_app (user, package_name, app_id, device_type, action)
    VALUES (:user, :package_name, :app_id, :device_type, :action);
  `;

  // Run the SQL query asynchronously, but we don't need to await it
  sequelize.query(SQL, {
    replacements: {
      user,
      package_name,
      app_id,
      device_type,
      action,
    },
    type: QueryTypes.INSERT,
  }).then(() => {
    console.log('App action logged successfully');
  }).catch((err) => {
    console.error('Failed to log app action:', err);
  });
}
