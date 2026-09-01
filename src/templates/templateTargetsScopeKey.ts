/**
 * The key under which `renderTemplateFile` hands the resolved targets to `{% path %}` and
 * `{% reference %}`.
 *
 * Passed as Liquid *globals* rather than in the scope: globals cannot be shadowed by a manifest
 * variable or computed, and — unlike the scope — they survive into the isolated context that
 * `{% render %}` spawns. The colon keeps the key out of reach anyway, since it is not a readable
 * Liquid variable reference, while `Context.getSync` walks properties and is unaffected by it.
 */
export const templateTargetsScopeKey = "stub:templateTargets";
