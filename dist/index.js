"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const core_1 = require("@actions/core");
const ENV = {
    email: (0, core_1.getInput)("heroku_email"),
    apiKey: (0, core_1.getInput)("api_key"),
    devAppName: (0, core_1.getInput)("dev_app_name"),
    // uatAppName: core.getInput("uat_app_name"),
};
const createNetrcFile = ({ email, apiKey }) => `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${apiKey}
machine git.heroku.com
    login ${email}
    password ${apiKey}
EOF`;
const addRemotes = ({ devAppName }) => {
    const addRemote = (app) => {
        (0, child_process_1.execSync)(`heroku git:remote --app ${app}`);
        (0, child_process_1.execSync)(`git remote rename heroku ${app}`);
    };
    addRemote(devAppName);
    // addRemote(uatAppName);
};
const deploy = ({ devAppName }) => {
    const pushRemote = (app) => {
        (0, child_process_1.exec)(`git push ${app} master`);
    };
    pushRemote(devAppName);
    // pushRemote(uatAppName);
};
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    (0, child_process_1.execSync)(`git config user.name "YJ CI"`);
    (0, child_process_1.execSync)(`git config user.email ${ENV.email}`);
    const hasUncommittedChanges = !!(0, child_process_1.execSync)("git status --porcelain").toString().trim();
    if (hasUncommittedChanges) {
        throw new Error("Uncommitted changes were found - aborting");
    }
    createNetrcFile(ENV);
    addRemotes(ENV);
    deploy(ENV);
});
main().catch(console.error);
