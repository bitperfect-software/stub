import type { Liquid } from "liquidjs";
import pluralize from "pluralize";

export const registerPluralizeFilters = (engine: Liquid) => {
    engine.registerFilter("plural", (value: unknown) => pluralize.plural(String(value)));
    engine.registerFilter("singular", (value: unknown) => pluralize.singular(String(value)));
};
