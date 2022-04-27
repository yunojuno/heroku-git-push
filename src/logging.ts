import { error, info } from "@actions/core";
import { formatAppMessage } from "./utils";

export const printInfo = (message: string, app?: string) => {
  info(!!app ? formatAppMessage(message, app) : message);
};

export const printSuccess = (message: string, app?: string) => {
  const greenMessage = `\u001b[32m${message}`;
  info(!!app ? formatAppMessage(greenMessage, app) : greenMessage);
};

export const printError = (message: string, app?: string) => {
  const redMessage = `\u001b[31m${message}`;
  error(!!app ? formatAppMessage(redMessage, app) : redMessage);
};
