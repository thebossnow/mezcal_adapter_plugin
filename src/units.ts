/**
 * The node schema stores everything in feet — the native unit of the source
 * domain (US residential/ADU zoning, and the aiblueprint-mcp DXF/compliance
 * data this plugin imports). Pascal's own scene/floorplan coordinate space is
 * meters (`GeometryContext` docs: "Coordinates are level-local meters"), so
 * every consumer that touches Three.js or `FloorplanGeometry` converts at the
 * boundary via these helpers instead of the schema silently changing units.
 */
export const FEET_TO_METERS = 0.3048

export function ftToM(feet: number): number {
  return feet * FEET_TO_METERS
}

export type PlanPoint = readonly [number, number]

/** Convert an array of [x, y] points in feet to meters, preserving order. */
export function pointsToM(points: readonly PlanPoint[]): PlanPoint[] {
  return points.map(([x, y]) => [ftToM(x), ftToM(y)] as const)
}
