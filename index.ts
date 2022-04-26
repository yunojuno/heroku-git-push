import { exec, execSync } from 'child_process';
import { getInput } from "@actions/core";

const ENV = {
  email: getInput("heroku_email"),
  apiKey: getInput("api_key"),
  devAppName: getInput("dev_app_name"),
  // uatAppName: core.getInput("uat_app_name"),
} as const;

type Env = typeof ENV;

const createNetrcFile = ({ email, apiKey }: Env) => `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${apiKey}
machine git.heroku.com
    login ${email}
    password ${apiKey}
EOF`;

const addRemotes = ({ devAppName }: Env) => {
  const addRemote = (app: string) => {
    execSync(`heroku git:remote --app ${app}`);
    execSync(`git remote rename heroku ${app}`);
  };

  addRemote(devAppName);
  // addRemote(uatAppName);
};

const deploy = ({ devAppName }: Env) => {
  const pushRemote = (app: string) => {
    exec(`git push ${app} master`);
  };

  pushRemote(devAppName);
  // pushRemote(uatAppName);
};

const main = async () => {
  execSync(`git config user.name "YJ CI"`);
  execSync(`git config user.email ${ENV.email}`);

  const hasUncommittedChanges = !!execSync("git status --porcelain").toString().trim();

  if (hasUncommittedChanges) {
    throw new Error("Uncommitted changes were found - aborting");
  }

  createNetrcFile(ENV);
  addRemotes(ENV);
  deploy(ENV);
};

main().catch(console.error);