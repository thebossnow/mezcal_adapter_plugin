import { z } from 'zod'
import { MezcalCompliance, MezcalFootprint, MezcalPoint, MezcalRequirements, type SitePlanNode } from './schema'

/**
 * The bundled JSON export this plugin consumes. Phase 1 has no live
 * connection to aiblueprint-mcp — a user runs it through their existing MCP
 * client (Claude Desktop, etc.), exports this bundle, and imports the file
 * here. Proposed as a new `view.export` / `project` operation upstream
 * (`format: "mezcal"` or similar): today's GeoJSON boundary/footprint export
 * merged with `compliance.report`'s payload, so the plugin never has to
 * recompute setback/coverage/height math the Python engine already did.
 *
 * Versioned (`version: 1`) so a future export shape can add a migration here
 * instead of breaking existing saved scenes.
 */
export const MezcalExportV1 = z.object({
  version: z.literal(1),
  meta: z
    .object({
      generatedBy: z.string().optional(),
      generatedAt: z.string().optional(),
    })
    .optional(),
  boundary: z.array(MezcalPoint).min(3),
  setbackEnvelope: z.array(MezcalPoint).optional(),
  footprints: z.array(MezcalFootprint).optional(),
  requirements: MezcalRequirements.optional(),
  compliance: MezcalCompliance.optional(),
  warnings: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
})
export type MezcalExportV1 = z.infer<typeof MezcalExportV1>

export type ParseResult =
  | { ok: true; patch: Partial<SitePlanNode>; issueCount: number }
  | { ok: false; error: string }

/**
 * Pure validation + mapping from a parsed export bundle to a `SitePlanNode`
 * patch. Takes already-`JSON.parse`d input so it stays testable without any
 * File/DOM API — the import UI (`import-field.tsx`) owns reading the file or
 * textarea and calls this with the result.
 */
export function parseMezcalExport(raw: unknown, sourceFile?: string): ParseResult {
  const result = MezcalExportV1.safeParse(raw)
  if (!result.success) {
    return { ok: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }
  }
  const data = result.data
  const patch: Partial<SitePlanNode> = {
    boundary: data.boundary,
    setbackEnvelope: data.setbackEnvelope ?? [],
    footprints: data.footprints ?? [],
    requirements: data.requirements ?? {},
    compliance: data.compliance,
    warnings: data.warnings ?? [],
    notes: data.notes ?? [],
    sourceFile,
    importedAt: new Date().toISOString(),
  }
  return { ok: true, patch, issueCount: (data.warnings?.length ?? 0) + (data.notes?.length ?? 0) }
}
