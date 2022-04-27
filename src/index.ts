import { exec, execSync } from "child_process";
import {
  error,
  getInput,
  getMultilineInput,
  info,
  setFailed,
} from "@actions/core";

const inputs = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  appNames: getMultilineInput("app_names"),
  pushTimeout: getInput("push_timeout") || "5000",
} as const;

const checkInputs = () => {
  const allPresent = Object.values(inputs).every(
    (value) => !!value && !!value.length
  );

  if (!allPresent) {
    throw new Error("Missing an input variable");
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
  const addRemote = (app: string, index: number) => {
    try {
      info(`[App ${index}] Setting remote with Heroku CLI...`);
      execSync(`heroku git:remote --app ${app}`);
      info(`[App ${index}] Finished setting remote with Heroku CLI`);

      info(`[App ${index}] Renaming remote branch...`);
      execSync(`git remote rename heroku ${app}`);
      info(`[App ${index}] Finished renaming remote branch`);
    } catch (e) {
      error(`An error occurred whilst setting remote for app [${index}].`);
      e instanceof Error && setFailed(e);
    }
  };

  inputs.appNames.forEach(addRemote);
};

const pushRemotes = (branch: string) => {
  const pushRemote = (app: string, index: number) => {
    info(`[App ${index}] Pushing branch to Heroku remote...`);
    exec(
      `git push ${app} ${branch}`,
      { timeout: Number(inputs.pushTimeout) },
      function (err, stdout, stderr) {
        if (stderr) {
          error(`An error occurred whilst pushing branch for app [${index}].`);
          setFailed(stderr);
        }
        info(stdout);
      }
    );

    info(`[App ${index}] Finished pushing branch to Heroku remote`);
  };

  inputs.appNames.forEach(pushRemote);
};

const main = async () => {
  const branch = execSync("git branch --show-current").toString().trim();

  if (branch !== "master" || "main") {
    setFailed("Branch must be 'master' or 'main'");
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
