import { inputs } from "./index";
import { checkInputs, createNetrcFile } from "./utils";
import { printSuccess } from "./logging";
import { execSync } from "child_process";

jest.mock("./logging");
jest.mock("child_process");

const EXPECTED_CREATE_NETRC_COMMAND = `cat >~/.netrc <<EOF
machine api.heroku.com
    login e@mail.com
    password APIKEY
machine git.heroku.com
    login e@mail.com
    password APIKEY
EOF`;

describe("utils", () => {
  describe("checkInputs", () => {
    it("calls printSuccess and does not throw error with valid input", () => {
      const validInput: typeof inputs = {
        email: "e@mail.com",
        apiKey: "APIKEY",
        appNames: ["app-1", "app-2"],
        debug: false,
      };

      const test = () => {
        checkInputs(validInput);
      };

      expect(test).not.toThrow();
      expect(printSuccess).toHaveBeenCalledWith("All inputs present\n");
    });

    it("throws error if some inputs are missing", () => {
      const invalidInput: typeof inputs = {
        email: "",
        apiKey: "APIKEY",
        appNames: [],
        debug: false,
      };

      const test = () => {
        checkInputs(invalidInput);
      };

      expect(test).toThrowError("Missing input variable(s): email,appNames");
      expect(printSuccess).not.toBeCalled();
    });
  });

  describe("createNetrcFile", () => {
    it("calls execSync with correct values and calls printSuccess", () => {
      createNetrcFile("e@mail.com", "APIKEY");

      expect(execSync).toHaveBeenCalledWith(EXPECTED_CREATE_NETRC_COMMAND);
      expect(printSuccess).toHaveBeenCalledWith("Created ~/.netrc\n");
    });
  });
});
