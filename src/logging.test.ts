import { printError, printInfo, printLog, printSuccess } from "./logging";
import { error, info } from "@actions/core";

jest.mock("@actions/core");

describe("logging", () => {
  describe.each([
    { name: "printInfo", printFn: printInfo, colourCode: "", coreFn: info },
    {
      name: "printSuccess",
      printFn: printSuccess,
      colourCode: "\u001b[32m",
      coreFn: info,
    },
    {
      name: "printError",
      printFn: printError,
      colourCode: "\u001b[31m",
      coreFn: error,
    },
    {
      name: "printLog",
      printFn: printLog,
      colourCode: "\u001b[33m",
      coreFn: info,
    },
  ])("log functions", ({ name, printFn, colourCode, coreFn }) => {
    describe(name, () => {
      it("prints a message with info", () => {
        printFn("Some message");

        expect(coreFn).toHaveBeenCalledWith(`${colourCode}Some message`);
      });

      it("prints an app formatted message", () => {
        printFn("Some message", "app-name");

        expect(coreFn).toHaveBeenCalledWith(
          `[\u001b[36mapp-name] \u001b[0m${colourCode}Some message`
        );
      });
    });
  });
});
