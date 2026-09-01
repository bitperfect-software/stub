import { fileURLToPath } from "node:url";
import { z } from "zod";
import { readJsonFile } from "io/readJsonFile.ts";

/**
 * The version `--version` reports, read from the package's own manifest at startup.
 *
 * Resolved through the package name rather than a path relative to this file, so it is the same
 * expression whether the code runs from `src/` under tsx or from the bundled `dist/index.js`. This is
 * what package.json's `exports: { "./package.json": … }` entry exists for: Node only allows a package
 * to self-reference when `exports` is declared.
 */
export const readPackageVersion = (): string =>
    z
        .object({ version: z.string() })
        .parse(readJsonFile(fileURLToPath(import.meta.resolve("@bitperfect-software/stub/package.json")))).version;
