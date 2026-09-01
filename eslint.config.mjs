import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

/** Relative imports are banned; every module is imported from the `src` root, with its `.ts` extension. */
const noRelativeImports = {
    regex: "^\\.\\.?(/|$)",
    message: 'Relative imports are not allowed. Import from the src root, e.g. "io/writeTextFile.ts".',
};

/** `node:` is a documented, greppable layer boundary, so a bare builtin specifier is an error. */
const noBareNodeBuiltins = {
    regex:
        "^(assert|buffer|child_process|console|crypto|events|fs|http|https|module|os|path|process|" +
        "readline|stream|string_decoder|timers|tty|url|util|worker_threads|zlib)(/|$)",
    message: 'Import Node built-ins with the "node:" prefix.',
};

/** Commander is Commander only where the CLI is assembled. `name` is not legal inside `patterns`. */
const commanderOnlyInCommands = {
    regex: "^commander$",
    message: "Commander is confined to src/commands/.",
};

/** The filesystem has exactly two doors, and both are greppable. */
const filesystemOnlyInIo = {
    regex: "^node:fs(/|$)",
    message: "Filesystem access is confined to src/io/ and src/workspace/findProjectRoot.ts.",
};

/**
 * `no-restricted-imports` replaces rather than merges — and so does a later config block that sets
 * the same rule. Every block therefore states the whole pattern list that applies to its files, and
 * the blocks that lift a layer restriction are kept disjoint so exactly one of them can win.
 */
const restrictedImports = (...layers) => ["error", { patterns: [noRelativeImports, noBareNodeBuiltins, ...layers] }];

export default defineConfig([
    globalIgnores(["dist/**", "coverage/**"]),
    {
        files: ["src/**/*.ts", "test/**/*.ts"],
        plugins: { js },
        extends: [
            js.configs.recommended,
            ...tseslint.configs.strictTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
            eslintConfigPrettier,
        ],
        languageOptions: {
            globals: globals.node,
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
        rules: {
            "no-console": "off",
            "no-restricted-imports": restrictedImports(),
            "no-unneeded-ternary": "warn",
            "no-nested-ternary": "warn",
            "@typescript-eslint/array-type": ["error", { default: "generic" }],
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/non-nullable-type-assertion-style": "off",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
        },
    },

    // The layer boundaries CLAUDE.md describes, as rules rather than prose. Both restrictions apply to
    // src/ by default; the two blocks below lift one each, and they never match the same file.
    {
        files: ["src/**/*.ts"],
        rules: { "no-restricted-imports": restrictedImports(commanderOnlyInCommands, filesystemOnlyInIo) },
    },
    {
        files: ["src/commands/**/*.ts"],
        rules: { "no-restricted-imports": restrictedImports(filesystemOnlyInIo) },
    },
    {
        files: ["src/io/**/*.ts", "src/workspace/findProjectRoot.ts"],
        rules: { "no-restricted-imports": restrictedImports(commanderOnlyInCommands) },
    },
    {
        files: ["src/**/*.ts"],
        ignores: ["src/commands/**", "src/index.ts"],
        rules: { "no-console": "error" },
    },
]);
