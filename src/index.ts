import { execSync } from "child_process";
import { getInput, getMultilineInput, info, setFailed } from "@actions/core";
import { checkInputs, createNetrcFile } from "./utils";
import { addRemotes, pushToRemotes } from "./git";
import { printSuccess } from "./logging";

export const inputs = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  appNames: getMultilineInput("app_names"),
  sourceBranch: getInput("source_branch"),
  targetBranch: getInput("target_branch"),
  debug: getInput("debug").toLowerCase() === "true",
} as const;

const main = async () => {
  info("Checking branch...");
  const branch = execSync("git branch --show-current").toString().trim();

  if (!["main", "master", inputs.sourceBranch].includes(branch)) {
    setFailed(
      `Branch must be 'master', 'main', or '${inputs.sourceBranch}' - got: ${branch} `
    );
  }
  printSuccess(`Branch name is set to ${branch}\n`);

  info("Checking all input variables are present...");
  checkInputs(inputs);

  info("Creating .netrc file...");
  createNetrcFile(inputs.email, inputs.apiKey);

  info("Setting remotes");
  addRemotes(inputs.appNames, inputs.debug);

  info("Starting push to Heroku remotes");
  await pushToRemotes(
    inputs.appNames,
    branch,
    inputs.targetBranch ?? inputs.sourceBranch ?? branch,
    inputs.debug
  );
  printSuccess("All done!");
  process.exit();
};

main().catch((err) => {
  setFailed(err);
});
