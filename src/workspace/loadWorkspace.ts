import * as path from "node:path";
import { loadManifest } from "manifest/loadManifest.ts";
import { createTemplateEngine } from "templates/createTemplateEngine.ts";
import type { Settings } from "settings/defaultSettings.ts";
import type { Workspace } from "workspace/Workspace.ts";

/** Reads everything a run depends on: the manifest, and a Liquid engine rooted at the stub directory. */
export const loadWorkspace = (projectRoot: string, settings: Settings): Workspace => {
    const stubDir = path.join(projectRoot, settings.stubDirName);

    return {
        settings,
        projectRoot,
        stubDir,
        engine: createTemplateEngine(stubDir, settings.templateExtension),
        manifest: loadManifest(path.join(stubDir, settings.manifestFileName)),
    };
};
