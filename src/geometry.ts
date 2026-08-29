import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshStandardMaterial,
  Shape,
  Vector2,
} from 'three'
import type { GeometryContext } from '@pascal-app/core'
import { ftToM, type PlanPoint } from './units'
import type { MezcalFootprintKind, SitePlanNode } from './schema'

const BOUNDARY_PAD_THICKNESS_M = 0.05
const SETBACK_LINE_Y_M = 0.06

const COMPLIANCE_TINT: Record<'pass' | 'fail' | 'unknown', number> = {
  pass: 0x3aa76d,
  fail: 0xd9534f,
  unknown: 0x8a8f98,
}

const FOOTPRINT_COLOR: Record<MezcalFootprintKind, number> = {
  existing: 0x9aa0a6,
  proposed: 0x4a90d9,
  adu: 0xf0ad4e,
}

function shapeFromPoints(points: readonly PlanPoint[]): Shape {
  const shape = new Shape()
  points.forEach(([x, y], i) => {
    const v = new Vector2(ftToM(x), ftToM(y))
    if (i === 0) shape.moveTo(v.x, v.y)
    else shape.lineTo(v.x, v.y)
  })
  shape.closePath()
  return shape
}

/** Flat pad marking the lot boundary — a thin extrusion rather than a plane
 * so it reads correctly under Pascal's standard lighting/outline pass. */
function buildBoundaryPad(node: SitePlanNode): Mesh | null {
  if (node.boundary.length < 3) return null
  const geometry = new ExtrudeGeometry(shapeFromPoints(node.boundary), {
    depth: BOUNDARY_PAD_THICKNESS_M,
    bevelEnabled: false,
  })
  geometry.rotateX(-Math.PI / 2)
  const material = new MeshStandardMaterial({ color: 0xd8d3c4, roughness: 1, side: DoubleSide })
  return new Mesh(geometry, material)
}

/** Dashed-in-spirit setback envelope, rendered as a solid outline loop at a
 * slight height above the pad — three.js `LineDashedMaterial` requires a
 * screen-space pixel ratio the generic geometry path doesn't have access to,
 * so Phase 1 uses a solid loop; the floor-plan view (`floorplan.ts`) is
 * where the dashed convention actually reads clearly. */
function buildSetbackLoop(node: SitePlanNode): LineLoop | null {
  if (node.setbackEnvelope.length < 3) return null
  const positions: number[] = []
  for (const [x, y] of node.setbackEnvelope) {
    positions.push(ftToM(x), SETBACK_LINE_Y_M, ftToM(y))
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const overall = node.compliance?.overall ?? 'unknown'
  const material = new LineBasicMaterial({ color: COMPLIANCE_TINT[overall] })
  return new LineLoop(geometry, material)
}

function buildFootprint(footprint: SitePlanNode['footprints'][number]): Mesh {
  const geometry = new ExtrudeGeometry(shapeFromPoints(footprint.points), {
    depth: ftToM(footprint.heightFt),
    bevelEnabled: false,
  })
  geometry.rotateX(-Math.PI / 2)
  const material = new MeshStandardMaterial({
    color: FOOTPRINT_COLOR[footprint.kind],
    roughness: 0.8,
    transparent: footprint.kind === 'adu' || footprint.kind === 'proposed',
    opacity: footprint.kind === 'existing' ? 1 : 0.85,
  })
  return new Mesh(geometry, material)
}

/**
 * Pure `def.geometry` builder — massing only, no selection/outline chrome
 * (the framework's generic `<GeometrySystem>` handles that for any kind that
 * provides `geometry` without a custom `renderer`). See `geometryKey` in
 * `definition.ts` for the paired cache-key function.
 */
export function buildSitePlanGeometry(node: SitePlanNode, _ctx: GeometryContext) {
  const group = new Group()
  const pad = buildBoundaryPad(node)
  if (pad) group.add(pad)
  const setback = buildSetbackLoop(node)
  if (setback) group.add(setback)
  for (const footprint of node.footprints) {
    group.add(buildFootprint(footprint))
  }
  return group
}

/** Deterministic over exactly the fields `buildSitePlanGeometry` reads, so
 * `<GeometrySystem>` can skip rebuilds when an unrelated field (e.g. `name`)
 * changes. Safe here because — unlike wall/fence — this kind's geometry
 * never depends on `ctx.siblings` or `ctx.children`. */
export function sitePlanGeometryKey(node: SitePlanNode): string {
  return JSON.stringify([node.boundary, node.setbackEnvelope, node.footprints, node.compliance?.overall])
}
