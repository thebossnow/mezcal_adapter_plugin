import { describe, expect, test } from 'bun:test'
import { parseMezcalExport } from './import'

const validBundle = {
  version: 1,
  meta: { generatedBy: 'aiblueprint-mcp', generatedAt: '2026-08-28T00:00:00Z' },
  boundary: [
    [0, 0],
    [100, 0],
    [100, 80],
    [0, 80],
  ],
  setbackEnvelope: [
    [10, 15],
    [90, 15],
    [90, 70],
    [10, 70],
  ],
  footprints: [
    { id: 'existing-1', label: 'Main House', kind: 'existing', points: [[10, 15], [40, 15], [40, 45], [10, 45]], heightFt: 18 },
    { id: 'adu-1', label: 'Proposed ADU', kind: 'adu', points: [[55, 15], [85, 15], [85, 40], [55, 40]], heightFt: 16 },
  ],
  requirements: { setbackFrontFt: 15, setbackRearFt: 10, setbackSideFt: 5, maxHeightFt: 16, maxCoveragePct: 50, maxSqft: 1200 },
  compliance: { overall: 'pass', area: { ok: true }, setbacks: { ok: true } },
  warnings: [],
  notes: ['ADU height at max allowed.'],
} as const

describe('parseMezcalExport', () => {
  test('accepts a well-formed bundle and maps it to a node patch', () => {
    const result = parseMezcalExport(validBundle, 'lot-127-110-84.json')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.patch.boundary).toEqual(validBundle.boundary as unknown as [number, number][])
    expect(result.patch.footprints).toHaveLength(2)
    expect(result.patch.compliance?.overall).toBe('pass')
    expect(result.patch.sourceFile).toBe('lot-127-110-84.json')
    expect(result.issueCount).toBe(1)
  })

  test('accepts a minimal bundle with only a boundary', () => {
    const result = parseMezcalExport({ version: 1, boundary: validBundle.boundary })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.patch.footprints).toEqual([])
    expect(result.patch.requirements).toEqual({})
  })

  test('rejects a boundary with fewer than 3 points', () => {
    const result = parseMezcalExport({ version: 1, boundary: [[0, 0], [1, 1]] })
    expect(result.ok).toBe(false)
  })

  test('rejects an unversioned or wrong-version payload', () => {
    expect(parseMezcalExport({ boundary: validBundle.boundary }).ok).toBe(false)
    expect(parseMezcalExport({ version: 2, boundary: validBundle.boundary }).ok).toBe(false)
  })

  test('rejects non-object input', () => {
    expect(parseMezcalExport('not json').ok).toBe(false)
    expect(parseMezcalExport(null).ok).toBe(false)
  })
})
