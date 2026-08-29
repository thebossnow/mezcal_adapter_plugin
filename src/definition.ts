import type { NodeDefinition } from '@pascal-app/core'
import { buildSitePlanFloorplan } from './floorplan'
import { buildSitePlanGeometry, sitePlanGeometryKey } from './geometry'
import { sitePlanParametrics } from './parametrics'
import { SitePlanNode } from './schema'

type SitePlanDefinition = NodeDefinition<typeof SitePlanNode> & Record<string, unknown>

/**
 * The `mezcal:site-plan` node definition. No `tool`/`renderer`/`system`:
 *
 *  - No placement tool — there's nothing to click-and-place. A node of this
 *    kind is created fully-formed by the "Mezcal" editor panel (`panel.tsx`)
 *    once an export is imported, the same way a container node would be
 *    seeded by host code rather than drawn.
 *  - No custom `renderer` — `geometry` (pure Three.js) is enough per the
 *    docs' "ship without per-kind renderer.tsx" path, so the framework's
 *    generic renderer handles mounting/selection/outline chrome.
 *
 * `presentation.hidden: true` mirrors the Nature plugin's tree/flower/grass
 * kinds: hidden from the drag-place palette because there's no tool, but
 * still labeled/iconed for the inspector and scene tree.
 */
export const sitePlanDefinition: SitePlanDefinition = {
  kind: 'mezcal:site-plan',
  schemaVersion: 1,
  schema: SitePlanNode,
  category: 'site',

  defaults: () => ({
    object: 'node',
    parentId: null,
    visible: true,
    metadata: {},
    boundary: [],
    setbackEnvelope: [],
    footprints: [],
    requirements: {},
    warnings: [],
    notes: [],
  }),

  capabilities: {
    // Absolute plan-space geometry (see schema.ts) — not a movable item.
    selectable: { hitVolume: 'mesh' },
    duplicable: false,
    deletable: true,
    // Not presettable: a saved preset of one lot's boundary has no meaning
    // on a different lot.
    presettable: false,
  },

  parametrics: sitePlanParametrics,
  geometry: buildSitePlanGeometry,
  geometryKey: sitePlanGeometryKey,
  floorplan: buildSitePlanFloorplan,

  presentation: {
    label: 'Mezcal Site Plan',
    description:
      'A site boundary, setback envelope, and building footprints imported from a Mezcal (aiblueprint-mcp) export.',
    icon: { kind: 'iconify', name: 'lucide:map' },
    paletteSection: 'site',
    hidden: true,
  },

  mcp: {
    description:
      'An imported ADU/site-plan boundary with a resolved CA zoning envelope (setbacks, max height, max coverage, max sq ft) and — once a footprint is checked — a pass/fail compliance report per aiblueprint-mcp. Read-only: created and updated by importing a Mezcal export, not by AI-driven edits in Phase 1.',
  },
}
