import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Everything a run produced under `root`, keyed by posix-relative path and sorted, so a whole
 * generated tree can be compared in one assertion. The stub directory is filtered out: it is input.
 */
export const readTree = (root: string, stubDirName = ".stub"): Record<string, string> => {
    if (!fs.existsSync(root)) return {};

    const entries = fs
        .readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
        .filter((relativePath) => !relativePath.startsWith(`${stubDirName}/`))
        .sort();

    return Object.fromEntries(
        entries.map((relativePath) => [relativePath, fs.readFileSync(path.join(root, relativePath), "utf-8")]),
    );
};
