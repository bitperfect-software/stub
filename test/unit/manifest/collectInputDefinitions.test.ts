import { describe, expect, it } from "vitest";
import { collectInputDefinitions } from "manifest/collectInputDefinitions.ts";
import { makeManifest } from "test/support/makeManifest.ts";

const variable = (name: string, description: string) => ({ name, description });
const computed = (name: string, value: string) => ({ name, description: `the ${name}`, value });

describe("collectInputDefinitions", () => {
    it("puts the manifest globals before the template's own declarations", () => {
        const manifest = makeManifest({
            variables: [variable("entity", "global")],
            templates: { model: { path: "a.ts", variables: [variable("field", "local")] } },
        });

        expect(collectInputDefinitions(manifest, "model").variables.map(({ name }) => name)).toEqual([
            "entity",
            "field",
        ]);
    });

    it("keeps the global when a template redeclares a variable of the same name", () => {
        const manifest = makeManifest({
            variables: [variable("entity", "global")],
            templates: { model: { path: "a.ts", variables: [variable("entity", "local")] } },
        });

        expect(collectInputDefinitions(manifest, "model").variables).toEqual([variable("entity", "global")]);
    });

    it("keeps the first declaration when two required templates declare the same computed", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts", requires: ["b", "c"] },
                b: { path: "b.ts", computed: [computed("label", "first")] },
                c: { path: "c.ts", computed: [computed("label", "second")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").computed.map(({ value }) => value)).toEqual(["first"]);
    });

    it("exposes the variables of every template it requires", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts", requires: ["b"] },
                b: { path: "b.ts", variables: [variable("field", "b's")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").variables).toEqual([variable("field", "b's")]);
    });

    it("exposes the computed of every template it requires", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts", requires: ["b"] },
                b: { path: "b.ts", computed: [computed("label", "{{ entity }}")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").computed.map(({ name }) => name)).toEqual(["label"]);
    });

    it("exposes the switches of every template it requires", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts", requires: ["b"] },
                b: { path: "b.ts", switches: [variable("noDelete", "b's")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").switches).toEqual([variable("noDelete", "b's")]);
    });

    it("exposes declarations transitively", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts", requires: ["b"] },
                b: { path: "b.ts", requires: ["c"] },
                c: { path: "c.ts", variables: [variable("deep", "c's")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").variables).toEqual([variable("deep", "c's")]);
    });

    it("ignores a requires entry the manifest does not declare", () => {
        const manifest = makeManifest({ templates: { a: { path: "a.ts", requires: ["ghost"] } } });

        expect(collectInputDefinitions(manifest, "a").variables).toEqual([]);
    });

    it("returns only the globals for a template that declares nothing", () => {
        const manifest = makeManifest({
            variables: [variable("entity", "global")],
            templates: { a: { path: "a.ts" } },
        });

        expect(collectInputDefinitions(manifest, "a").variables).toEqual([variable("entity", "global")]);
    });

    it("does not expose a sibling's declarations when it is not required", () => {
        const manifest = makeManifest({
            templates: {
                a: { path: "a.ts" },
                b: { path: "b.ts", variables: [variable("field", "b's")] },
            },
        });

        expect(collectInputDefinitions(manifest, "a").variables).toEqual([]);
    });

    it("does not expose a template's own computed twice when it also requires itself", () => {
        const manifest = makeManifest({
            templates: { a: { path: "a.ts", requires: ["a"], computed: [computed("label", "once")] } },
        });

        expect(collectInputDefinitions(manifest, "a").computed).toHaveLength(1);
    });
});
