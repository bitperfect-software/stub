import { describe, expect, it } from "vitest";
import { readJsonFile } from "io/readJsonFile.ts";
import { runStub, runStubDirectly } from "test/support/runStub.ts";
import { tempDir } from "test/support/tempDir.ts";
import { useFixture } from "test/support/useFixture.ts";
import { writeStubDirectory } from "test/support/makeWorkspace.ts";

const workload = {
    manifest: {
        variables: [{ name: "entity", description: "the entity name" }],
        computed: [{ name: "entityPlural", description: "the plural form", value: "{{ entity | plural }}" }],
        switches: [{ name: "noDelete", description: "drops the delete handling" }],
        templates: {
            page: { path: "out/{{ entity }}Page.tsx" },
            useColumnsHook: { path: "out/use{{ entity }}Columns.ts" },
        },
    },
    bodies: { page: "page", useColumnsHook: "hook" },
};

const project = () => {
    const projectRoot = tempDir();

    writeStubDirectory(projectRoot, workload);

    return projectRoot;
};

describe("--help and guide", () => {
    it("lists one kebab-cased command per manifest entry in --help", () => {
        const { status, stdout } = runStub(project(), ["--help"]);

        expect(status).toBe(0);
        expect(stdout).toContain("page");
        expect(stdout).toContain("use-columns-hook");
    });

    it("appends the overview footer to root --help", () => {
        expect(runStub(project(), ["--help"]).stdout).toContain(".stub");
    });

    it("lists positionals, computed overrides and switches in a command's --help", () => {
        const { status, stdout } = runStub(project(), ["page", "--help"]);

        expect(status).toBe(0);
        expect(stdout).toContain("<entity>");
        expect(stdout).toContain("--entityPlural <value>");
        expect(stdout).toContain("(default: {{ entity | plural }})");
        expect(stdout).toContain("--noDelete");
    });

    it("prints the guide", () => {
        const { status, stdout } = runStub(project(), ["guide"]);

        expect(status).toBe(0);
        expect(stdout.length).toBeGreaterThan(500);
    });

    // The regression test for the hardcoded 0.0.1 this replaced.
    it("prints the version from package.json", () => {
        const { version } = readJsonFile("package.json") as { version: string };
        const { status, stdout } = runStub(project(), ["--version"]);

        expect(status).toBe(0);
        expect(stdout.trim()).toBe(version);
    });

    it("runs through the shebang, so the executable bit survives the build", () => {
        const { status, stdout } = runStubDirectly(project(), ["--version"]);

        expect(status).toBe(0);
        expect(stdout.trim()).toBe((readJsonFile("package.json") as { version: string }).version);
    });
});

describe("--help, --version and guide without a project", () => {
    it.each([["guide"], ["--help"], ["--version"]])("runs %s with no .stub anywhere", (argument) => {
        expect(runStub(tempDir(), [argument]).status).toBe(0);
    });
});

// The phase-02 fix: these are exactly the commands someone runs *because* their project is broken.
describe("--help, --version and guide with a broken project", () => {
    const brokenFixtures = ["broken-json", "broken-schema", "no-manifest", "duplicate-command", "duplicate-flag"];

    it.each(
        brokenFixtures.flatMap((fixture) => [
            [fixture, "guide"],
            [fixture, "--help"],
            [fixture, "--version"],
        ]),
    )("runs %s's %s and exits 0", (fixture, argument) => {
        const { status, stderr } = runStub(useFixture(fixture), [argument]);

        expect(status).toBe(0);
        expect(stderr).not.toContain("\n    at ");
    });

    it("mentions that no template commands are available in --help when the manifest is broken", () => {
        const { stdout } = runStub(useFixture("broken-json"), ["--help"]);

        expect(stdout).toContain("No template commands are available:");
        expect(stdout).toContain("Invalid JSON in file");
    });

    it("names the conflict in --help when two manifest keys produce the same command name", () => {
        expect(runStub(useFixture("duplicate-command"), ["--help"]).stdout).toContain("use-columns-hook");
    });

    it("names the conflict in --help when a computed and a switch produce the same flag", () => {
        expect(runStub(useFixture("duplicate-flag"), ["--help"]).stdout).toContain("--force");
    });
});
