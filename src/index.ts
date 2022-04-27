import { execSync, spawn } from "child_process";
import {
  error,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";
import { printAppMessage } from "./utils";

const inputs = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  appNames: getMultilineInput("app_names"),
  pushTimeout: getInput("push_timeout"),
} as const;

const checkInputs = () => {
  const missingValues = Object.entries(inputs).reduce<string[]>(
    (missing, [inputName, inputValue]) =>
      !!inputValue && !!inputValue.length ? missing : [...missing, inputName],
    []
  );

  if (missingValues.length) {
    throw new Error(`Missing input variable(s): ${missingValues.toString()}`);
  }
};

const createNetrcFile = () =>
  execSync(`cat >~/.netrc <<EOF
machine api.heroku.com
    login ${inputs.email}
    password ${inputs.apiKey}
machine git.heroku.com
    login ${inputs.email}
    password ${inputs.apiKey}
EOF`);

const addRemotes = () => {
  const addRemote = (app: string) => {
    const printMessage = printAppMessage(app);
    try {
      printMessage("Setting remote with Heroku CLI...");
      execSync(`heroku git:remote --app ${app}`);
      printMessage("Finished setting remote with Heroku CLI");

      printMessage("Renaming remote branch...");
      execSync(`git remote rename heroku ${app}`);
      printMessage("Finished renaming remote branch");
    } catch (e) {
      error(`An error occurred whilst setting remote for app [${app}].`);
      e instanceof Error && setFailed(e);
    }
  };

  inputs.appNames.forEach(addRemote);
};

const pushRemotes = (branch: string) => {
  const pushRemote = (app: string) => {
    const printMessage = printAppMessage(app);
    printMessage("Pushing branch to Heroku remote...");
    const proc = spawn(`git push ${app} ${branch}`, {
      timeout: Number(inputs.pushTimeout),
    });

    proc.stderr.addListener("data", (data) => {
      if (data.toString().includes("Building source:")) {
        proc.kill();
      }
    });

    printMessage("Finished pushing branch to Heroku remote");
  };

  inputs.appNames.forEach(pushRemote);
};

const main = async () => {
  const branch = execSync("git branch --show-current").toString().trim();

  if (!["main", "master"].includes(branch)) {
    setFailed(`Branch must be 'master' or 'main' - got: ${branch}`);
  }

  info("Checking all input variables are present...");
  checkInputs();
  info("All input variables are present!");

  info("Creating .netrc file...");
  createNetrcFile();
  info("Finished creating .netrc file!");

  info("Setting remote(s)...");
  addRemotes();
  info("Finished setting remote(s)!");

  info("Pushing to Heroku remote(s)...");
  pushRemotes(branch);
  info("Finished pushing to Heroku remote(s)!");
};

main().catch((err) => {
  setFailed(err);
});
