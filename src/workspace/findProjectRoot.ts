import * as fs from "node:fs";
import * as path from "node:path";

const containsDirectory = (directory: string, requiredDirectoryName: string): boolean => {
    const candidate = path.join(directory, requiredDirectoryName);

    return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
};

const searchUpwards = (directory: string, requiredDirectoryName: string): string | null => {
    if (containsDirectory(directory, requiredDirectoryName)) return directory;

    const parent = path.dirname(directory);

    // At the filesystem root, dirname returns the directory itself.
    return parent === directory ? null : searchUpwards(parent, requiredDirectoryName);
};

/**
 * The closest ancestor of `startPath` (including itself) that contains a `stubDirName` directory,
 * or null if there is none. Every generated path is resolved against the result.
 */
export const findProjectRoot = (startPath: string, stubDirName: string): string | null => {
    const absolutePath = path.resolve(startPath);

    // A start path that no longer exists — a deleted working directory — simply has no project.
    if (!fs.existsSync(absolutePath)) return null;

    const startDirectory = fs.statSync(absolutePath).isDirectory() ? absolutePath : path.dirname(absolutePath);

    return searchUpwards(startDirectory, stubDirName);
};
