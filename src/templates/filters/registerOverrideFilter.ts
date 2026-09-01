import type { Liquid } from "liquidjs";

/** `{{ derived | override: maybeValue }}` -> `maybeValue ?? derived`. */
export const registerOverrideFilter = (engine: Liquid) => {
    engine.registerFilter("override", (value: unknown, override: unknown): unknown => override ?? value);
};
