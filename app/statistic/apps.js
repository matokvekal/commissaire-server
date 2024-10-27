import { QueryTypes } from "sequelize";

/**
 *
 * @param {string} user - The user performing the action.
 * @param {string} package_name - The package name of the app.
 * @param {number} app_id - The ID of the app.
 * @param {number} device_type - The type of device.
 * @param {string} action - The action performed (add, remove, change).
 */
export function logAppAction(
  sequelize,
  user,
  package_name,
  app_id,
  device_type,
  action,
  status = null
) {
  const SQL = `
    INSERT INTO statistic_app (user, package_name, app_id, device_type, action,status)
    VALUES (:user, :package_name, :app_id, :device_type, :action,:status);
  `;

  sequelize
    .query(SQL, {
      replacements: {
        user,
        package_name,
        app_id,
        device_type,
        action,
        status,
      },
      type: QueryTypes.INSERT,
    })
    .then(() => {
      console.log("App action logged successfully");
    })
    .catch((err) => {
      console.error("Failed to log app action:", err);
    });
}
