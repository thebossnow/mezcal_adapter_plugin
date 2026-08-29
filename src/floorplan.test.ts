import { describe, expect, test } from 'bun:test'
import { buildSitePlanFloorplan } from './floorplan'
import { SitePlanNode } from './schema'

const ctx = { resolve: () => undefined, children: [], siblings: [], parent: null } as unknown as Parameters<
  typeof buildSitePlanFloorplan
>[1]

describe('buildSitePlanFloorplan', () => {
  test('returns null for a node with no boundary', () => {
    const node = SitePlanNode.parse({})
    expect(buildSitePlanFloorplan(node, ctx)).toBeNull()
  })

  test('converts feet to meters and includes one polygon per footprint', () => {
    const node = SitePlanNode.parse({
      boundary: [
        [0, 0],
        [100, 0],
        [100, 80],
        [0, 80],
      ],
      footprints: [{ id: 'a', points: [[0, 0], [10, 0], [10, 10], [0, 10]], heightFt: 16 }],
    })
    const result = buildSitePlanFloorplan(node, ctx)
    expect(result?.kind).toBe('group')
    if (result?.kind !== 'group') return
    const boundaryPolygon = result.children.find((c) => c.kind === 'polygon')
    expect(boundaryPolygon?.kind === 'polygon' && boundaryPolygon.points[1]?.[0]).toBeCloseTo(100 * 0.3048, 4)
    const polygons = result.children.filter((c) => c.kind === 'polygon')
    // boundary + one footprint
    expect(polygons).toHaveLength(2)
    const labels = result.children.filter((c) => c.kind === 'text')
    expect(labels).toHaveLength(1)
  })

  test('draws the setback envelope only when it has at least 3 points', () => {
    const withoutSetback = SitePlanNode.parse({
      boundary: [[0, 0], [10, 0], [10, 10], [0, 10]],
    })
    const resultWithout = buildSitePlanFloorplan(withoutSetback, ctx)
    expect(resultWithout?.kind === 'group' && resultWithout.children.filter((c) => c.kind === 'polygon')).toHaveLength(1)

    const withSetback = SitePlanNode.parse({
      boundary: [[0, 0], [10, 0], [10, 10], [0, 10]],
      setbackEnvelope: [[2, 2], [8, 2], [8, 8], [2, 8]],
    })
    const resultWith = buildSitePlanFloorplan(withSetback, ctx)
    expect(resultWith?.kind === 'group' && resultWith.children.filter((c) => c.kind === 'polygon')).toHaveLength(2)
  })
})
