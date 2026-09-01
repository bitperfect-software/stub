import type { Liquid } from "liquidjs";
import type { ComputedDefinition } from "manifest/manifestSchema.ts";
import { renderExpression, type RenderScope } from "templates/renderLiquid.ts";

/**
 * Resolves computed values left to right, so a later expression can build on an earlier one.
 * A value the user passed on the CLI short-circuits its derivation.
 */
export const deriveScope = (engine: Liquid, computed: Array<ComputedDefinition>, input: RenderScope): RenderScope =>
    computed.reduce<RenderScope>(
        (scope, { name, value }) => ({ ...scope, [name]: input[name] ?? renderExpression(engine, value, scope) }),
        { ...input },
    );
