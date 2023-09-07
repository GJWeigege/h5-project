import sh from "exec-sh";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let shSync = sh.promise;
let localDir = path.resolve(__dirname, "../build");
let remoteDir = `/www/wwwroot/roki.h5.cenmetahome.cn`;
let shell = `scp -r ${localDir}/* webdeploy@101.42.24.166:${remoteDir}`;
console.log(shell);
shSync(shell).then((resp) => {
  console.log("deploy finished.");
});
