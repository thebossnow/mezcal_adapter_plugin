import type { AnyNodeDefinition, Plugin } from '@pascal-app/core'
import { sitePlanDefinition } from './definition'

type PluginHostPanel = {
  id: string
  label: string
  icon: { kind: 'url'; src: string } | { kind: 'iconify'; name: string }
  component: () => Promise<{ default: React.ComponentType }>
  pluginId: string
  description: string
  creator: {
    name: string
    url?: string
  }
  pluginUrl: string
  defaultInstalled: boolean
}

/**
 * The Mezcal adapter plugin manifest. One node kind (`mezcal:site-plan`) —
 * see `definition.ts` for why it has no placement tool — plus a left-rail
 * panel (`mezcalHostPanel`) that's the actual entry point for creating one.
 *
 * Phase 1 scope only (see README): static import of a bundled JSON export,
 * no live connection to aiblueprint-mcp, no account/OAuth data. That keeps
 * this plugin out of the docs' "Connected services and personal data"
 * review section entirely.
 */
export const mezcalPlugin: Plugin = {
  id: 'thebossnow:mezcal',
  apiVersion: 1,
  nodes: [sitePlanDefinition as unknown as AnyNodeDefinition],
}

export const mezcalHostPanel: PluginHostPanel = {
  id: 'thebossnow:mezcal:panel',
  label: 'Mezcal',
  icon: { kind: 'iconify', name: 'lucide:map' },
  component: () => import('./panel'),
  pluginId: mezcalPlugin.id,
  description: 'Import site-plan and ADU compliance data from aiblueprint-mcp.',
  creator: {
    name: 'thebossnow',
    url: 'https://github.com/thebossnow',
  },
  pluginUrl: 'https://github.com/thebossnow/mezcal_adapter_plugin',
  defaultInstalled: false,
}

export { sitePlanDefinition } from './definition'
export { parseMezcalExport, type MezcalExportV1 } from './import'
export { SitePlanNode, MezcalFootprint, MezcalRequirements, MezcalCompliance } from './schema'
