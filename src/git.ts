import { execSync, spawn } from "child_process";
import { setFailed } from "@actions/core";
import { printError, printInfo, printSuccess } from "./logging";

/**
 * Uses Heroku CLI to create a remote branch for each app.
 *
 * By default creates a branch called heroku, which we rename to the unique app name
 *
 * @param appNames unique Heroku app names
 */
export const addRemotes = (appNames: string[]) => {
  const addRemote = (app: string) => {
    try {
      execSync(`heroku git:remote --app ${app}`);
      printSuccess("Set remote with Heroku CLI", app);
      execSync(`git remote rename heroku ${app}`);
      printSuccess("Renamed remote", app);
    } catch (e) {
      printError("An error occurred whilst setting remote", app);
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
      return triggerWord;
    }
  }
  return false;
};

const handleProcessOutput = (
  data: Buffer,
  app: string,
  pushed: (app: string) => void
) => {
  printInfo(`${data.toString()}`, app);

  const matchingWord = testForKill(data.toString());

  if (!!matchingWord) {
    printInfo(`Detected: "${matchingWord}`, app);
    printInfo("Marking app as pushed", app);
    pushed(app);
  }
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
    new Promise<string>((pushed, failed) => {
      printInfo(`Pushing ${branch} to remote`, app);
      const pushProcess = spawn("git", ["push", app, branch]);

      // check stdout for kill words
      pushProcess.stdout.on("data", (data: Buffer) =>
        handleProcessOutput(data, app, pushed)
      );

      // check stderr for kill words
      pushProcess.stderr.on("data", (data: Buffer) =>
        handleProcessOutput(data, app, pushed)
      );

      // reject and set fail on error
      pushProcess.on("error", (error: Error) => {
        setFailed(error);
        failed();
      });
    });

  try {
    const pushedApps = await Promise.all(appNames.map(pushRemote));
    printSuccess(`Finished pushing apps: ${pushedApps.toString()}`);
  } catch (e) {
    printError("Something went wrong pushing apps");
    e instanceof Error && setFailed(e);
  }
};
