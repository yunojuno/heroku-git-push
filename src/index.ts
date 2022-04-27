import { execSync, spawn } from "child_process";
import { getInput, info, setFailed } from "@actions/core";

const ENV = {
  email: getInput("email"),
  apiKey: getInput("api_key"),
  devAppName: getInput("dev_app_name"),
  // uatAppName: core.getInput("uat_app_name"),
} as const;

type Env = typeof ENV;

const createNetrcFile = ({ email, apiKey }: Env) => execSync(`cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${apiKey}
machine git.heroku.com
    login ${email}
    password ${apiKey}
EOF`);

const addRemotes = ({ devAppName }: Env) => {
  const addRemote = (app: string) => {
    try {
      info("Setting remote with Heroku CLI...")
      execSync(`heroku git:remote --app ${app}`);
      info("Finished setting remote with Heroku CLI")
      info("Renaming remote branch...")
      execSync(`git remote rename heroku ${app}`);
      info("Finished renaming remote branch")
    } catch (e) {
      setFailed((e as any).message);
    }
  };

  addRemote(devAppName);
  // addRemote(uatAppName);
};

const deploy = ({ devAppName }: Env) => {
  const processKillTriggerWords = [
    "building source",
    "remote",
    "compressing source files"
  ];

  const testForKill = (str: string) => {
      for(const triggerWord in processKillTriggerWords) {
        if(str.includes(processKillTriggerWords[triggerWord])) {
          return true;
        }
      }
      return false;
  };

  const pushRemote = (app: string) => {
    info("Pushing master to heroku remote...")
    const child_process = spawn("git", ["push", app]);

    child_process.on("spawn", () => info("Process spawned."));
    child_process.stdout.on("data", (data: Buffer) => {
        info(`stdout: ${data.toString()}`)
        if(testForKill(data.toString())) {
          child_process.kill();  
        }
    });
    child_process.stderr.on("data", (data: Buffer) => {
        info(`stderr: ${data.toString()}`);
        if(testForKill(data.toString())) {
          child_process.kill();  
        }
    });
    child_process.on("error", (error: Error) => {
        setFailed(error);
        child_process.kill();
    });
    child_process.on("close", (code: string) => {
        console.log(`child process close all stdio with code ${code}`);
    });
    child_process.on("exit", (code: string) => {
        console.log(`child process exited with code ${code}`);
    });

    info("Finished pushing master to heroku remote")
  };

  pushRemote(devAppName);
  // pushRemote(uatAppName);
};

const main = async () => {
  info("Setting git config...")
  execSync(`git config user.name "YJ CI"`);
  execSync(`git config user.email ${ENV.email}`);
  info("Finished setting git config")

  const hasUncommittedChanges = !!execSync("git status --porcelain").toString().trim();

  if (hasUncommittedChanges) {
    setFailed("Branch has uncommitted changes - aborting...");
    return;
  }

  info("Creating .netrc file...")
  createNetrcFile(ENV);
  info("Finished creating .netrc file")

  info("Setting remotes...")
  addRemotes(ENV);
  info("Finished setting remotes")

  info("Deploying...")
  deploy(ENV);
  info("Finished deploying")
};

main().catch(console.error);