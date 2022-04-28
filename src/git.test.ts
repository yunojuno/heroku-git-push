import { addRemotes, pushToRemotes, testForKill } from "./git";
import { execSync, spawn } from "child_process";
import { printError, printInfo, printLog, printSuccess } from "./logging";
import { info, setFailed } from "@actions/core";

jest.mock("child_process");
jest.mock("./logging");
jest.mock("@actions/core");

describe("git", () => {
  describe("addRemotes", () => {
    const appNames = ["app-1", "app-2"];

    it("calls execSync with expected params and prints success", () => {
      addRemotes(appNames, false);

      expect(execSync).toHaveBeenCalledTimes(4);

      expect(execSync).toHaveBeenNthCalledWith(
        1,
        "heroku git:remote --app app-1",
        { stdio: "ignore" }
      );
      expect(execSync).toHaveBeenNthCalledWith(
        2,
        "git remote rename heroku app-1"
      );
      expect(execSync).toHaveBeenNthCalledWith(
        3,
        "heroku git:remote --app app-2",
        { stdio: "ignore" }
      );
      expect(execSync).toHaveBeenNthCalledWith(
        4,
        "git remote rename heroku app-2"
      );

      expect(printSuccess).toHaveBeenCalledTimes(2);
      expect(printSuccess).toHaveBeenNthCalledWith(
        1,
        "Set remote with Heroku CLI",
        "app-1"
      );
      expect(printSuccess).toHaveBeenNthCalledWith(
        2,
        "Set remote with Heroku CLI",
        "app-2"
      );
    });

    it("prints error and calls setFailed with error if execSync fails", () => {
      const mockError = new Error("Test error");
      (execSync as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });

      addRemotes(appNames, false);

      expect(printError).toHaveBeenCalledTimes(1);
      expect(printError).toHaveBeenCalledWith(
        "An error occurred whilst setting remote",
        "app-1"
      );
      expect(setFailed).toHaveBeenCalledWith(mockError);
    });

    it("calls execSync with stdio inherit if debug is true", () => {
      addRemotes(["app"], true);

      expect(execSync).toHaveBeenNthCalledWith(1, expect.any(String), {
        stdio: "inherit",
      });
    });

    it("prints a newline after finishing", () => {
      addRemotes(["app"], false);

      expect(info).toHaveBeenCalledTimes(1);
      expect(info).toHaveBeenCalledWith("");
    });
  });

  describe("testForKill", () => {
    it.each([
      ["building source", "building source"],
      ["remote", "remote"],
      ["compressing source files", "compressing source files"],
      ["compressing source files", "compressing source files with extra text"],
      [false, "non matching string"],
    ])("returns %s for input %s", (expected, input) => {
      expect(testForKill(input)).toEqual(expected);
    });
  });

  describe("pushToRemote", () => {
    it("calls correct spawn command with correct print messages", () => {
      pushToRemotes(["app-1"], "main", false);

      expect(printInfo).toHaveBeenCalledWith("Pushing main to remote", "app-1");
      expect(spawn).toHaveBeenCalledWith("git", ["push", "app-1", "main"]);
    });

    const mockOn = jest.fn();

    const testHappyPath = async (mockFn: jest.Mock) => {
      const promise = pushToRemotes(["app-1"], "main", false);

      expect(printInfo).toHaveBeenCalledTimes(1);

      mockFn.mock.calls[0][1]("remote");

      await promise;

      expect(printInfo).toHaveBeenCalledTimes(2);
      expect(printInfo).toHaveBeenNthCalledWith(
        2,
        `Detected: "remote"`,
        "app-1"
      );
      expect(printSuccess).toHaveBeenNthCalledWith(
        1,
        "Marking app as pushed",
        "app-1"
      );

      expect(printError).not.toHaveBeenCalled();
      expect(printSuccess).toHaveBeenNthCalledWith(
        2,
        "Finished pushing apps: app-1"
      );
      expect(info).toHaveBeenCalledWith("");
    };

    it("resolves promise if spawn process prints kill word to stdout", async () => {
      (spawn as jest.Mock).mockReturnValue({
        stdout: {
          on: mockOn,
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn(),
      });

      await testHappyPath(mockOn);
    });

    it("resolves promise if spawn process prints kill word to stderr", async () => {
      (spawn as jest.Mock).mockReturnValue({
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: mockOn,
        },
        on: jest.fn(),
      });

      await testHappyPath(mockOn);
    });

    it("prints error and fails if on error is called", async () => {
      (spawn as jest.Mock).mockReturnValue({
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn(),
        },
        on: mockOn,
      });
      const error = new Error("Test error");

      const promise = pushToRemotes(["app-1"], "main", false);

      mockOn.mock.calls[0][1](error);

      await promise;

      expect(printError).toHaveBeenCalledWith(
        "Something went wrong pushing apps"
      );
      expect(setFailed).toHaveBeenCalledWith(error);
    });

    it("attaches printLog to all stdio if debug is true", async () => {
      const stdio = [
        {
          on: jest.fn(),
        },
        {
          on: jest.fn(),
        },
        {
          on: jest.fn(),
        },
      ];

      (spawn as jest.Mock).mockReturnValue({
        stdio,
      });

      const promise = pushToRemotes(["app-1"], "main", true);

      expect(stdio[0].on).toHaveBeenCalledWith("data", expect.any(Function));
      expect(stdio[1].on).toHaveBeenCalledWith("data", expect.any(Function));
      expect(stdio[2].on).toHaveBeenCalledWith("data", expect.any(Function));

      stdio[0].on.mock.calls[0][1]("test output");

      await promise;

      expect(printLog).toHaveBeenCalledWith("test output", "app-1");
    });
  });
});
