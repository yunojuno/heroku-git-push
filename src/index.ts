import { execSync } from "child_process";
import {
  getBooleanInput,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { checkInputs, createNetrcFile } from "./utils";
import { addRemotes, pushToRemotes } from "./git";
import { printSuccess } from "./logging";

const inputs = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  appNames: getMultilineInput("app_names"),
  debug: getBooleanInput("debug"),
} as const;

const main = async () => {
  info("Checking branch...");
  const branch = execSync("git branch --show-current").toString().trim();

  if (!["main", "master"].includes(branch)) {
    setFailed(`Branch must be 'master' or 'main' - got: ${branch}`);
  }
  printSuccess(`Branch name is set to ${branch}\n`);

  info("Checking all input variables are present...");
  checkInputs(inputs);
  printSuccess("All inputs present\n");

  info("Creating .netrc file...");
  createNetrcFile(inputs.email, inputs.apiKey);

  info("Setting remotes");
  addRemotes(inputs.appNames, inputs.debug);

  info("Starting push to Heroku remotes");
  await pushToRemotes(inputs.appNames, branch, inputs.debug);
  printSuccess("All done!");
  process.exit();
};

main().catch((err) => {
  setFailed(err);
});
