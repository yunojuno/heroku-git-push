import { printAppMessage } from "../src/utils";
import { info } from "@actions/core";

jest.mock("@actions/core");

describe("utils", () => {
  describe("printAppMessage", () => {
    it("calls info with the expected message with app name", () => {
      printAppMessage("test-app")("some text");

      expect(info).toHaveBeenCalledWith("[test-app] some text");
    });
  });
});
