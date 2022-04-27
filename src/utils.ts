import { execSync } from "child_process";
import { printSuccess } from "./logging";

/**
 * Formats a message with app name
 *
 * @param message message to format
 * @param app app name
 */
export const formatAppMessage = (message: string, app: string) =>
  `[${app}] ${message}`;

/**
 * Checks to see if all inputs are present.
 *
 * Throws an error containing any missing values
 *
 * @param inputs set of inputs from action input
 */
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

/**
 * Creates a .netrc file with user credentials
 *
 * @param email the users email
 * @param apiKey the secret API key
 */
export const createNetrcFile = (email: string, apiKey: string) => {
  execSync(`cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${apiKey}
machine git.heroku.com
    login ${email}
    password ${apiKey}
EOF`);

  printSuccess("Created ~/.netrc\n");
};
