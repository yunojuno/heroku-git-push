import { execSync, spawn } from "child_process";
import { info, setFailed } from "@actions/core";
import { printError, printInfo, printLog, printSuccess } from "./logging";

/**
 * Uses Heroku CLI to create a remote branch for each app.
 *
 * By default creates a branch called heroku, which we rename to the unique app name
 *
 * @param appNames unique Heroku app names
 * @param debug show all logs
 */
export const addRemotes = (appNames: string[], debug: boolean) => {
  const addRemote = (app: string) => {
    try {
      execSync(`heroku git:remote --app ${app}`, {
        stdio: debug ? "inherit" : "ignore",
      });
      execSync(`git remote rename heroku ${app}`);
      printSuccess("Set remote with Heroku CLI", app);
    } catch (e) {
      printError("An error occurred whilst setting remote", app);
      e instanceof Error && setFailed(e);
      throw e;
    }
  };

  appNames.forEach(addRemote);
  // Leave some space after
  info("");
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
  for (const triggerWord of processKillTriggerWords) {
    if (input.includes(triggerWord)) {
      return triggerWord;
    }
  }
  return false;
};

/**
 * Handler which takes the process output and resolves if matched word is found.
 *
 * @param data process data
 * @param app app name
 * @param pushed app promise callback
 */
const handleProcessOutput = (
  data: Buffer,
  app: string,
  pushed: (app: string) => void
) => {
  const matchingWord = testForKill(data.toString());

  if (!!matchingWord) {
    printInfo(`Detected: "${matchingWord}"`, app);
    printSuccess("Marking app as pushed", app);
    pushed(app);
  }
};

/**
 * Pushes the current branch to the remotes of the provided app names.
 *
 * @param appNames unique Heroku app names
 * @param sourceBranch current branch name
 * @param targetBranch branch to push to on Heroku
 * @param debug show all logs
 *
 * @return promise which resolves once all remotes have finished pushing
 */
export const pushToRemotes = async (
  appNames: string[],
  sourceBranch: string,
  targetBranch: string,
  debug: boolean
) => {
  const pushToRemote = (app: string) =>
    new Promise<string>((pushed, failed) => {
      printInfo(`Pushing ${sourceBranch} to remote`, app);
      const pushProcess = spawn("git", [
        "push",
        app,
        `${sourceBranch}:${targetBranch}`,
      ]);

      debug &&
        pushProcess.stdio.forEach((io) =>
          io?.on("data", (data) => printLog(data.toString(), app))
        );

      // check stdout for kill words
      pushProcess.stdout.on("data", (data: Buffer) => {
        handleProcessOutput(data, app, pushed);
      });

      // check stderr for kill words
      pushProcess.stderr.on("data", (data: Buffer) => {
        handleProcessOutput(data, app, pushed);
      });

      // reject and set fail on error
      pushProcess.on("error", (error: Error) => {
        setFailed(error);
        failed(error);
      });
    });

  let timeout;
  try {
    const pushedApps = await Promise.race([
      Promise.all(appNames.map(pushToRemote)),
      new Promise<string[]>(
        (res, rej) =>
          (timeout = setTimeout(
            () => rej("Timed out waiting for trigger word"),
            30000
          ))
      ),
    ]);
    printSuccess(`Finished pushing apps: ${pushedApps.toString()}`);
    // Leave some space after
    info("");
  } catch (e) {
    printError("Something went wrong pushing apps");
    e instanceof Error && setFailed(e);
    throw e;
  } finally {
    clearTimeout(timeout);
  }
};
