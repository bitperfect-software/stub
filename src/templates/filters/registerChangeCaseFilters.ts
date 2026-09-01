import type { Liquid } from "liquidjs";
import * as changeCase from "change-case";

const caseFilters: Record<string, (value: string) => string> = {
    camelCase: changeCase.camelCase,
    capitalCase: changeCase.capitalCase,
    constantCase: changeCase.constantCase,
    dotCase: changeCase.dotCase,
    kebabCase: changeCase.kebabCase,
    noCase: changeCase.noCase,
    pascalCase: changeCase.pascalCase,
    pascalSnakeCase: changeCase.pascalSnakeCase,
    pathCase: changeCase.pathCase,
    sentenceCase: changeCase.sentenceCase,
    snakeCase: changeCase.snakeCase,
    trainCase: changeCase.trainCase,
};

export const registerChangeCaseFilters = (engine: Liquid) => {
    Object.entries(caseFilters).forEach(([filterName, transform]) => {
        // Wrapped rather than passed by reference, so extra Liquid arguments cannot reach change-case options.
        engine.registerFilter(filterName, (value: unknown) => transform(String(value)));
    });
};
