import { describe, expect, test } from 'bun:test'
import { buildSitePlanFloorplan } from './floorplan'
import { buildSitePlanGeometry } from './geometry'
import { parseMezcalExport } from './import'
import { SitePlanNode } from './schema'

const ctx = { resolve: () => undefined, children: [], siblings: [], parent: null } as unknown as Parameters<
  typeof buildSitePlanGeometry
>[1]

/**
 * Regression test against a bundle actually produced by aiblueprint-mcp's
 * `project.export_mezcal` operation (see thebossnow/aiblueprint-mcp PR #35),
 * not hand-authored — catches schema drift between the two repos. Generated
 * from an L-shaped lot (import_boundary) with an existing structure + ADU
 * footprint and a resolved (scripted, not questionnaire-driven) profile.
 */
describe('real aiblueprint-mcp export_mezcal bundle', () => {
  test('parses end-to-end and builds geometry/floorplan', async () => {
    const raw = await Bun.file(new URL('../examples/real-world-lot.mezcal.json', import.meta.url)).json()
    const result = parseMezcalExport(raw, 'real-world-lot.mezcal.json')
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const node = SitePlanNode.parse(result.patch)
    expect(node.boundary).toHaveLength(6) // L-shaped lot
    expect(node.footprints).toHaveLength(2)
    expect(node.footprints.map((f) => f.kind).sort()).toEqual(['adu', 'existing'])
    expect(node.setbackEnvelope.length).toBeGreaterThanOrEqual(6)
    expect(node.requirements.maxSqft).toBe(1000)
    expect(node.compliance?.overall).toBe('pass')
    expect(node.compliance?.coverage?.ok).toBe(true)

    const floorplan = buildSitePlanFloorplan(node, ctx)
    expect(floorplan?.kind).toBe('group')

    const geometry = buildSitePlanGeometry(node, ctx)
    // boundary pad + setback loop + 2 footprints
    expect(geometry.children.length).toBe(4)
  })
})
