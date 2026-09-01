import * as path from "node:path";
import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { addGlobalOptions } from "commands/globalOptions.ts";
import { registerTemplateCommand } from "commands/registerTemplateCommand.ts";
import { getTemplate } from "manifest/getTemplate.ts";
import { captureHelp } from "test/support/captureHelp.ts";
import { makeWorkspace, type StubDirectory } from "test/support/makeWorkspace.ts";
import { readTree } from "test/support/readTree.ts";
import { tempDir } from "test/support/tempDir.ts";

const contents: StubDirectory = {
    manifest: {
        variables: [{ name: "entity", description: "the entity name" }],
        computed: [{ name: "entityPlural", description: "the plural", value: "{{ entity | plural }}" }],
        switches: [{ name: "noDelete", description: "drops the delete handling" }],
        templates: {
            page: { path: "src/{{ entityPlural }}/{{ entity }}Page.tsx", requires: ["formData"] },
            formData: { path: "src/{{ entityPlural }}/{{ entity }}FormData.ts" },
        },
    },
    bodies: {
        page: "page {{ entity }} {{ entityPlural }}{% unless noDelete %} delete{% endunless %}",
        formData: "data {{ entity }}",
    },
};

/** The single command `registerTemplateCommand` adds. */
const onlyCommand = (program: Command): Command => {
    const [command] = program.commands;

    if (command === undefined) throw new Error("no command was registered");

    return command;
};

/** Registers one manifest entry on a real program and runs it, silencing the progress lines. */
const register = (templateName = "page") => {
    const projectRoot = tempDir();
    const workspace = makeWorkspace(projectRoot, contents);
    const program = addGlobalOptions(new Command().exitOverride());

    registerTemplateCommand(program, workspace, templateName, getTemplate(workspace.manifest, templateName));

    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    return {
        projectRoot,
        command: onlyCommand(program),
        /** Runs the command and returns the progress lines it printed. */
        run: (...args: Array<string>): Array<Array<unknown>> => {
            program.parse(["node", "stub", ...args]);

            const printed = [...log.mock.calls];

            log.mockRestore();

            return printed;
        },
    };
};

describe("registerTemplateCommand", () => {
    it("kebab-cases the manifest key into the command name", () => {
        const projectRoot = tempDir();
        const workspace = makeWorkspace(projectRoot, {
            manifest: { templates: { useColumnsHook: { path: "a.ts" } } },
        });
        const program = new Command();

        registerTemplateCommand(
            program,
            workspace,
            "useColumnsHook",
            getTemplate(workspace.manifest, "useColumnsHook"),
        );

        expect(onlyCommand(program).name()).toBe("use-columns-hook");
    });

    it("turns variables into positional arguments", () => {
        expect(captureHelp(register().command)).toContain("<entity>");
    });

    it("turns computed into --name <value> overrides and shows the expression as the default", () => {
        const help = captureHelp(register().command);

        expect(help).toContain("--entityPlural <value>");
        expect(help).toContain("(default: {{ entity | plural }})");
    });

    it("turns switches into boolean flags", () => {
        const help = captureHelp(register().command);

        expect(help).toContain("--noDelete");
        expect(help).not.toContain("--noDelete <value>");
    });

    it("falls back to a generated description when the manifest declares none", () => {
        expect(register().command.description()).toBe("Create a new page");
    });

    it("writes the whole chain from the positional variable", () => {
        const { projectRoot, run } = register();

        run("page", "Product");

        expect(readTree(projectRoot)).toEqual({
            "src/Products/ProductFormData.ts": "data Product",
            "src/Products/ProductPage.tsx": "page Product Products delete",
        });
    });

    it("propagates a computed override into every required template", () => {
        const { projectRoot, run } = register();

        run("page", "Product", "--entityPlural", "Producten");

        expect(Object.keys(readTree(projectRoot))).toEqual([
            "src/Producten/ProductFormData.ts",
            "src/Producten/ProductPage.tsx",
        ]);
    });

    it("passes a switch through to the body", () => {
        const { projectRoot, run } = register();

        run("page", "Product", "--noDelete");

        expect(readTree(projectRoot)["src/Products/ProductPage.tsx"]).toBe("page Product Products");
    });

    it("writes only the root template under --noRequires", () => {
        const { projectRoot, run } = register();

        run("--noRequires", "page", "Product");

        expect(Object.keys(readTree(projectRoot))).toEqual(["src/Products/ProductPage.tsx"]);
    });

    it("reports every file it rendered", () => {
        const { projectRoot, run } = register();

        expect(run("page", "Product")).toEqual([
            ["rendered to", path.join(projectRoot, "src/Products/ProductPage.tsx")],
            ["rendered to", path.join(projectRoot, "src/Products/ProductFormData.ts")],
        ]);
    });
});
