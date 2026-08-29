import type { FloorplanGeometry, GeometryContext } from '@pascal-app/core'
import { pointsToM } from './units'
import type { MezcalFootprintKind, SitePlanNode } from './schema'

const COMPLIANCE_STROKE: Record<'pass' | 'fail' | 'unknown', string> = {
  pass: '#3aa76d',
  fail: '#d9534f',
  unknown: '#8a8f98',
}

const FOOTPRINT_FILL: Record<MezcalFootprintKind, string> = {
  existing: '#9aa0a6',
  proposed: '#4a90d9',
  adu: '#f0ad4e',
}

/** Selection/hover stroke override — same convention as the Nature plugin's
 * `chromeOf` (see plugin-trees/src/floorplan.ts): only the boundary polygon
 * picks this up, since it's the one primitive with `pointerEvents` enabled. */
function selectionStroke(ctx: GeometryContext): string | null {
  const view = ctx.viewState
  if (!view?.palette) return null
  if (view.selected || view.highlighted) return view.palette.selectedStroke
  if (view.hovered) return view.palette.wallHoverStroke
  return null
}

function centroid(points: readonly (readonly [number, number])[]): [number, number] {
  const n = points.length || 1
  let x = 0
  let y = 0
  for (const p of points) {
    x += p[0]
    y += p[1]
  }
  return [x / n, y / n]
}

/**
 * Pure `def.floorplan` builder. Coordinates come out of `units.ts` in
 * level-local meters, matching `GeometryContext`'s documented convention —
 * the plugin never guesses at Pascal's world scale.
 */
export function buildSitePlanFloorplan(node: SitePlanNode, ctx: GeometryContext): FloorplanGeometry | null {
  if (node.boundary.length < 3) return null

  const overall = node.compliance?.overall ?? 'unknown'
  const selStroke = selectionStroke(ctx)
  const children: FloorplanGeometry[] = []

  children.push({
    kind: 'polygon',
    points: pointsToM(node.boundary),
    stroke: selStroke ?? '#5a5347',
    strokeWidth: 0.05,
    fill: '#d8d3c4',
    fillOpacity: 0.25,
    pointerEvents: 'visiblePainted',
  })

  if (node.setbackEnvelope.length >= 3) {
    children.push({
      kind: 'polygon',
      points: pointsToM(node.setbackEnvelope),
      stroke: COMPLIANCE_STROKE[overall],
      strokeWidth: 0.04,
      strokeDasharray: '0.3 0.2',
      fill: 'none',
      pointerEvents: 'none',
    })
  }

  for (const footprint of node.footprints) {
    const pts = pointsToM(footprint.points)
    children.push({
      kind: 'polygon',
      points: pts,
      stroke: '#2f2f2f',
      strokeWidth: 0.03,
      fill: FOOTPRINT_FILL[footprint.kind],
      fillOpacity: 0.6,
      pointerEvents: 'none',
    })
    const [cx, cy] = centroid(pts)
    children.push({
      kind: 'text',
      x: cx,
      y: cy,
      text: footprint.label,
      fontSize: 0.35,
      fill: '#1a1a1a',
      textAnchor: 'middle',
      dominantBaseline: 'middle',
      upright: true,
    })
  }

  // No `move-handle`: this kind has no `position` field and no `movable`
  // capability (see schema.ts) — the boundary is fixed, imported geometry,
  // not a draggable item. Re-import to update it (Phase 2: vertex-edit
  // affordances, see README).

  return { kind: 'group', children }
}
