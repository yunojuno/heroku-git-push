import { exec, execSync } from 'child_process';
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
  const pushRemote = (app: string) => {
    info("Pushing master to heroku remote...")
    execSync(`git push ${app} misc/heroku-push-action`);
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