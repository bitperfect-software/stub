import * as fs from "node:fs";
import * as path from "node:path";

/** Writes text to a file, creating parent directories as needed and overwriting any existing file. */
export const writeTextFile = (filePath: string, contents: string) => {
    const absolutePath = path.resolve(filePath);

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, contents, "utf-8");
};
