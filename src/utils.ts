import { info } from "@actions/core";
import { execSync } from "child_process";

export const printAppMessage = (app: string) => (message: string) =>
  info(`[App ${app}] ${message}`);

export const checkInputs = (inputs: Record<string, string | string[]>) => {
  const missingValues = Object.entries(inputs).reduce<string[]>(
    (missing, [inputName, inputValue]) =>
      !!inputValue && !!inputValue.length ? missing : [...missing, inputName],
    []
  );

  if (missingValues.length) {
    throw new Error(`Missing input variable(s): ${missingValues.toString()}`);
  }
};

export const createNetrcFile = (email: string, apiKey: string) =>
  execSync(`cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${apiKey}
machine git.heroku.com
    login ${email}
    password ${apiKey}
EOF`);
