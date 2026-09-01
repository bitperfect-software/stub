import { executeWritePlan } from "render/executeWritePlan.ts";
import { planTemplateWrites, type RenderRequest } from "render/planTemplateWrites.ts";
import type { Workspace } from "workspace/Workspace.ts";

/** Plan, write, report. The `--dry-run` seam is the gap between the first and second statement. */
export const runTemplateCommand = (workspace: Workspace, request: RenderRequest) => {
    const plan = planTemplateWrites(workspace, request);

    executeWritePlan(plan).forEach((targetPath) => {
        console.log("rendered to", targetPath);
    });
};
