import { describe, expect, test } from 'bun:test'
import { ftToM, pointsToM } from './units'

describe('units', () => {
  test('ftToM converts using the standard international foot', () => {
    expect(ftToM(1)).toBeCloseTo(0.3048, 6)
    expect(ftToM(100)).toBeCloseTo(30.48, 4)
  })

  test('pointsToM converts every point and preserves order', () => {
    expect(pointsToM([[0, 0], [10, 20]])).toEqual([
      [0, 0],
      [ftToM(10), ftToM(20)],
    ])
  })
})
