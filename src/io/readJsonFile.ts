import * as fs from "node:fs";
import * as path from "node:path";

/** Reads and JSON-parses a file. Validation is the caller's job — see `manifest/parseManifest.ts`. */
export const readJsonFile = (filePath: string): unknown => {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) throw new Error(`File not found: ${absolutePath}`);

    const rawJson = ((): string => {
        try {
            return fs.readFileSync(absolutePath, "utf-8");
        } catch (cause) {
            throw new Error(`Failed to read file: ${absolutePath}\n${String(cause)}`, { cause });
        }
    })();

    try {
        return JSON.parse(rawJson);
    } catch (cause) {
        throw new Error(`Invalid JSON in file: ${absolutePath}\n${String(cause)}`, { cause });
    }
};
