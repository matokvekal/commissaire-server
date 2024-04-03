/**
 * Logger
 *
 * Utility class logging wrapper
 *
 * console logging can be replaced by other services (kibana, sentry, etc...)
 */
class Logger {
  static getFormattedDate() {
    return `[${new Date().toLocaleString()}] `;
  }

  static debug(message, ...optionalParams) {
    console.debug(Logger.getFormattedDate(), message, ...optionalParams);
  }

  static info(message, ...optionalParams) {
    console.log(Logger.getFormattedDate(), message, ...optionalParams);
  }

  static error(message, ...optionalParams) {
    console.error(Logger.getFormattedDate(), message, ...optionalParams);
  }

  static warn(message, ...optionalParams) {
    console.warn(Logger.getFormattedDate(), message, ...optionalParams);
  }
}

export default Logger;
