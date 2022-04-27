import { info } from "@actions/core";

export const printAppMessage = (app: string) => (message: string) =>
  info(`[App ${app}] ${message}`);
