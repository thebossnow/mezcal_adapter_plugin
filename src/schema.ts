import { BaseNode, nodeType, objectId } from '@pascal-app/core'
import { z } from 'zod'

/** A plan-space [x, y] point, in feet — see `units.ts` for the feet→meters
 * conversion applied at render time. */
export const MezcalPoint = z.tuple([z.number(), z.number()])
export type MezcalPoint = z.infer<typeof MezcalPoint>

export const MezcalFootprintKind = z.enum(['existing', 'adu', 'proposed'])
export type MezcalFootprintKind = z.infer<typeof MezcalFootprintKind>

/** One building footprint on the lot — the primary residence, an existing
 * accessory structure, or the proposed ADU. Mirrors the `FOOTPRINT` /
 * `BUILDING` / `ADU` layer convention aiblueprint-mcp's site-plan generator
 * and IFC export already use. */
export const MezcalFootprint = z.object({
  id: z.string(),
  label: z.string().default('Structure'),
  kind: MezcalFootprintKind.default('proposed'),
  points: z.array(MezcalPoint).min(3),
  heightFt: z.number().positive().default(16),
})
export type MezcalFootprint = z.infer<typeof MezcalFootprint>

/** The resolved zoning envelope for this lot — the most restrictive value at
 * each layer (CA state → county → city → HOA/CC&Rs), as returned by
 * aiblueprint-mcp's `project.profile` / `compliance.requirements`. All
 * fields are optional because a boundary can be imported before (or without)
 * a resolved project profile. */
export const MezcalRequirements = z
  .object({
    setbackFrontFt: z.number().nonnegative().optional(),
    setbackRearFt: z.number().nonnegative().optional(),
    setbackSideFt: z.number().nonnegative().optional(),
    maxHeightFt: z.number().positive().optional(),
    maxCoveragePct: z.number().positive().optional(),
    maxSqft: z.number().positive().optional(),
  })
  .default({})
export type MezcalRequirements = z.infer<typeof MezcalRequirements>

const MezcalCheck = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
})

/** Mirrors the shape of aiblueprint-mcp's `compliance.report` payload —
 * one pass/fail per check plus an overall verdict used for the massing tint
 * in `geometry.ts` / `floorplan.ts`. */
export const MezcalCompliance = z.object({
  area: MezcalCheck.optional(),
  setbacks: MezcalCheck.optional(),
  coverage: MezcalCheck.optional(),
  height: MezcalCheck.optional(),
  overall: z.enum(['pass', 'fail', 'unknown']).default('unknown'),
})
export type MezcalCompliance = z.infer<typeof MezcalCompliance>

/**
 * A site plan imported from a Mezcal (aiblueprint-mcp) export. Unlike a
 * point-placed item (see the Nature plugin's `TreeNode`), this kind stores
 * absolute plan-space geometry directly — the same pattern the built-in
 * `SiteNode`/slab/ceiling kinds use — rather than a `position` + local
 * offsets. There is nothing to "place": the boundary IS the geometry, fixed
 * by the imported survey/DXF data. Moving or redrawing it is a Phase 2 gap
 * (see README) — for now, re-import to update.
 */
export const SitePlanNode = BaseNode.extend({
  id: objectId('site-plan'),
  type: nodeType('mezcal:site-plan'),
  boundary: z.array(MezcalPoint).default([]),
  /** Pre-computed setback envelope (already offset inward by aiblueprint-mcp's
   * `entity.offset`) — the plugin renders it as-is rather than recomputing a
   * polygon offset client-side, so the on-screen envelope always matches the
   * numbers the compliance engine actually checked against. */
  setbackEnvelope: z.array(MezcalPoint).default([]),
  footprints: z.array(MezcalFootprint).default([]),
  requirements: MezcalRequirements,
  compliance: MezcalCompliance.optional(),
  sourceFile: z.string().optional(),
  importedAt: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
})
export type SitePlanNode = z.infer<typeof SitePlanNode>
