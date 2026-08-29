import type { ParametricDescriptor } from '@pascal-app/core'
import ImportField from './import-field'
import type { SitePlanNode } from './schema'

/**
 * The site-plan's right-hand inspector. Everything here is import-driven —
 * there's no `movable`/`rotatable`/dimension-slider group like the Nature
 * plugin's tree, because the geometry is fixed, imported survey/DXF data
 * (see `schema.ts`). The only interactive field is `import-field.tsx`; the
 * requirements/compliance readout is a read-only `trailingSection`.
 *
 * Unlike `renderer`/`tool`/`trailingSection` (lazy `() => Promise<{default}>`),
 * a `custom` ParamField's `component` is a plain synchronous component
 * reference — so `ImportField` is a static import here, not a dynamic one.
 */
export const sitePlanParametrics: ParametricDescriptor<SitePlanNode> = {
  groups: [
    {
      label: 'Mezcal import',
      fields: [
        {
          key: 'import',
          kind: 'custom',
          component: ImportField,
        },
      ],
    },
  ],
  trailingSection: () => import('./requirements-panel').then((m) => ({ default: m.default })),
}
