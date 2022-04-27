import { execSync } from "child_process";
import { getInput, getMultilineInput, info, setFailed } from "@actions/core";
import { checkInputs, createNetrcFile } from "./utils";
import { addRemotes, pushRemotes } from "./git";

const inputs = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  appNames: getMultilineInput("app_names"),
} as const;

const main = async () => {
  const branch = execSync("git branch --show-current").toString().trim();

  if (!["main", "master"].includes(branch)) {
    setFailed(`Branch must be 'master' or 'main' - got: ${branch}`);
  }

  info("Checking all input variables are present...");
  checkInputs(inputs);
  info("All input variables are present!");

  info("Creating .netrc file...");
  createNetrcFile(inputs.email, inputs.apiKey);
  info("Finished creating .netrc file!");

  info("Setting remote(s)...");
  addRemotes(inputs.appNames);
  info("Finished setting remote(s)!");

  info("Pushing to Heroku remote(s)...");
  await pushRemotes(inputs.appNames, branch);
  info("Finished pushing to Heroku remote(s)!");
  process.exit();
};

main().catch((err) => {
  setFailed(err);
});
