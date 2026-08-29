import { describe, expect, test } from 'bun:test'
import { Group, Mesh } from 'three'
import { buildSitePlanGeometry, sitePlanGeometryKey } from './geometry'
import { SitePlanNode } from './schema'

const ctx = { resolve: () => undefined, children: [], siblings: [], parent: null } as unknown as Parameters<
  typeof buildSitePlanGeometry
>[1]

describe('buildSitePlanGeometry', () => {
  test('returns an empty group for a node with no boundary', () => {
    const node = SitePlanNode.parse({})
    const group = buildSitePlanGeometry(node, ctx)
    expect(group).toBeInstanceOf(Group)
    expect(group.children).toHaveLength(0)
  })

  test('adds a boundary pad mesh and one mesh per footprint', () => {
    const node = SitePlanNode.parse({
      boundary: [[0, 0], [10, 0], [10, 10], [0, 10]],
      footprints: [
        { id: 'a', points: [[1, 1], [4, 1], [4, 4], [1, 4]], heightFt: 16 },
        { id: 'b', points: [[6, 6], [8, 6], [8, 8], [6, 8]], heightFt: 12 },
      ],
    })
    const group = buildSitePlanGeometry(node, ctx)
    const meshes = group.children.filter((c) => c instanceof Mesh)
    // boundary pad + 2 footprints
    expect(meshes).toHaveLength(3)
  })
})

describe('sitePlanGeometryKey', () => {
  test('changes when geometry-relevant fields change', () => {
    const a = SitePlanNode.parse({ boundary: [[0, 0], [10, 0], [10, 10], [0, 10]] })
    const b = SitePlanNode.parse({ boundary: [[0, 0], [20, 0], [20, 10], [0, 10]] })
    expect(sitePlanGeometryKey(a)).not.toBe(sitePlanGeometryKey(b))
  })

  test('is stable for identical geometry-relevant fields', () => {
    const points: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]]
    const a = SitePlanNode.parse({ boundary: points, name: 'Lot A' })
    const b = SitePlanNode.parse({ boundary: points, name: 'Lot B' })
    expect(sitePlanGeometryKey(a)).toBe(sitePlanGeometryKey(b))
  })
})
