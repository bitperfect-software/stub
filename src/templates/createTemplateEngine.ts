import { Liquid } from "liquidjs";
import { registerChangeCaseFilters } from "templates/filters/registerChangeCaseFilters.ts";
import { registerPluralizeFilters } from "templates/filters/registerPluralizeFilters.ts";
import { registerOverrideFilter } from "templates/filters/registerOverrideFilter.ts";
import { registerPathTag } from "templates/tags/registerPathTag.ts";
import { registerReferenceTag } from "templates/tags/registerReferenceTag.ts";

/** Roots Liquid at the stub directory, so a manifest key like "page" resolves to `page.liquid`. */
export const createTemplateEngine = (stubDir: string, templateExtension: string): Liquid => {
    const engine = new Liquid({ root: stubDir, extname: templateExtension });

    registerChangeCaseFilters(engine);
    registerPluralizeFilters(engine);
    registerOverrideFilter(engine);
    registerPathTag(engine);
    registerReferenceTag(engine);

    return engine;
};
