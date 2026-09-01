import { execFileSync } from "node:child_process";

/** The e2e project's globalSetup: the suite spawns `dist/index.js`, so it has to exist and be current. */
export default () => {
    execFileSync("npm", ["run", "build"], { stdio: "inherit" });
};
