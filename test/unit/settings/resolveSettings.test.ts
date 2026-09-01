import { describe, expect, it } from "vitest";
import { defaultSettings } from "settings/defaultSettings.ts";
import { resolveSettings } from "settings/resolveSettings.ts";

describe("resolveSettings", () => {
    it("returns the built-in defaults", () => {
        expect(resolveSettings()).toEqual({
            stubDirName: ".stub",
            manifestFileName: "templates.json",
            templateExtension: ".liquid",
        });
    });

    it("is the single source, so it returns exactly defaultSettings", () => {
        expect(resolveSettings()).toBe(defaultSettings);
    });
});
