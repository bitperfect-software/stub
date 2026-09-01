import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { guideText } from "commands/guideText.ts";
import { registerGuideCommand } from "commands/registerGuideCommand.ts";

describe("registerGuideCommand", () => {
    it("prints the guide", () => {
        const program = new Command().exitOverride();
        const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

        registerGuideCommand(program);
        program.parse(["node", "stub", "guide"]);

        expect(log).toHaveBeenCalledWith(guideText);

        log.mockRestore();
    });
});
