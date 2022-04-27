import { printAppMessage } from "./utils";
import { execSync, spawn } from "child_process";
import { error, info, setFailed } from "@actions/core";

/**
 * Uses Heroku CLI to create a remote branch for each app.
 *
 * By default creates a branch called heroku, which we rename to the unique app name
 *
 * @param appNames unique Heroku app names
 */
export const addRemotes = (appNames: string[]) => {
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

  appNames.forEach(addRemote);
};

/**
 * Words which should trigger the process to be killed
 *
 * These signal that the push has finished and the build has started on Heroku
 */
const processKillTriggerWords = [
  "building source",
  "remote",
  "compressing source files",
];

/**
 * Tests an input to see if it contains one of the kill trigger words
 *
 * @param input string input from stdio
 */
export const testForKill = (input: string) => {
  for (const triggerWord in processKillTriggerWords) {
    if (input.includes(processKillTriggerWords[triggerWord])) {
      return true;
    }
  }
  return false;
};

/**
 * Pushes the current branch to the remotes of the provided app names.
 *
 * @param appNames unique Heroku app names
 * @param branch current branch name
 *
 * @return promise which resolves once all remotes have finished pushing
 */
export const pushRemotes = async (appNames: string[], branch: string) => {
  const pushRemote = (app: string) =>
    new Promise<void>((resolve, reject) => {
      const printMessage = printAppMessage(app);

      printMessage(`Pushing ${branch} to Heroku remote..`);

      const pushProcess = spawn("git", ["push", app, branch]);

      // check stdout for kill words
      pushProcess.stdout.on("data", (data: Buffer) => {
        if (testForKill(data.toString())) {
          info(`Finished pushing ${branch} to Heroku remote`);
          resolve();
        }
      });

      // check stderr for kill words
      pushProcess.stderr.on("data", (data: Buffer) => {
        if (testForKill(data.toString())) {
          info(`Finished pushing ${branch} to Heroku remote`);
          resolve();
        }
      });

      // reject and set fail on error
      pushProcess.on("error", (error: Error) => {
        setFailed(error);
        reject();
      });
    });

  return await Promise.all(appNames.map(pushRemote));
};
