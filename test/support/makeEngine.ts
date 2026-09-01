import type { Liquid } from "liquidjs";
import { createTemplateEngine } from "templates/createTemplateEngine.ts";

/** The production engine, rooted wherever the test put its bodies. */
export const makeEngine = (stubDir = process.cwd()): Liquid => createTemplateEngine(stubDir, ".liquid");
