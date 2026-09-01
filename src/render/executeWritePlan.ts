import { writeTextFile } from "io/writeTextFile.ts";
import type { PlannedWrite } from "render/PlannedWrite.ts";

/** The only function in the program that changes the filesystem. Returns the paths written, in order. */
export const executeWritePlan = (plan: Array<PlannedWrite>): Array<string> =>
    plan.map(({ targetPath, contents }) => {
        writeTextFile(targetPath, contents);

        return targetPath;
    });
