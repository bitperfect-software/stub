import type { Liquid } from "liquidjs";
import type { Manifest } from "manifest/manifestSchema.ts";
import type { Settings } from "settings/defaultSettings.ts";

/**
 * Everything resolved once at startup and threaded, read-only, through the pipeline.
 * If a function needs more than this, it is asking the wrong question.
 */
export interface Workspace {
    readonly settings: Settings;
    /** Closest ancestor of cwd containing the stub directory. All target paths are relative to it. */
    readonly projectRoot: string;
    /** `<projectRoot>/<settings.stubDirName>` — the Liquid root and the manifest's home. */
    readonly stubDir: string;
    readonly manifest: Manifest;
    readonly engine: Liquid;
}
