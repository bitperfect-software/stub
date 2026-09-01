import type { Context } from "liquidjs";
import type { ResolvedTarget } from "templates/ResolvedTarget.ts";
import { templateTargetsScopeKey } from "templates/templateTargetsScopeKey.ts";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isStringRecord = (value: unknown): value is Record<string, string> =>
    isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");

const isResolvedTarget = (value: unknown): value is ResolvedTarget =>
    isRecord(value) &&
    typeof value.path === "string" &&
    isStringRecord(value.references) &&
    (typeof value.defaultReference === "string" || value.defaultReference === null);

/**
 * Looks one manifest entry's resolved output out of the globals `renderTemplateFile` passes in.
 *
 * The globals arrive as `unknown`, hence the narrowing: their absence means the tag was used somewhere
 * that renders without them, which is every manifest expression.
 */
export const readResolvedTarget = (ctx: Context, tagName: string, targetName: string): ResolvedTarget => {
    const targets = ctx.getSync([templateTargetsScopeKey]);

    if (!isRecord(targets)) {
        throw new Error(`{% ${tagName} %} is only available in a template body, not in a manifest expression`);
    }

    const target = targets[targetName];

    if (!isResolvedTarget(target)) {
        throw new Error(`{% ${tagName} "${targetName}" %} refers to a template that is not in the manifest`);
    }

    return target;
};
