import { error, info } from "@actions/core";

/**
 * Prints an info message
 *
 * @param message log message
 * @param app app name for log format
 */
export const printInfo = (message: string, app?: string) => {
  info(!!app ? formatAppMessage(message, app) : message);
};

/**
 * Prints a green success message
 *
 * @param message log message
 * @param app app name for log format
 */
export const printSuccess = (message: string, app?: string) => {
  const greenMessage = `\u001b[32m${message}`;
  info(!!app ? formatAppMessage(greenMessage, app) : greenMessage);
};

/**
 * Prints a red error message
 *
 * Note: this doesn't actually throw an error
 *
 * @param message log message
 * @param app app name for log format
 */
export const printError = (message: string, app?: string) => {
  const redMessage = `\u001b[31m${message}`;
  error(!!app ? formatAppMessage(redMessage, app) : redMessage);
};

/**
 * Formats a message with app name
 *
 * @param message message to format
 * @param app app name
 */
const formatAppMessage = (message: string, app: string) =>
  `[${app}] ${message}`;
