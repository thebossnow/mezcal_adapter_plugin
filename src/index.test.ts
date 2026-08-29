import { describe, expect, test } from 'bun:test'
import { mezcalHostPanel, mezcalPlugin } from './index'

describe('Mezcal adapter plugin manifest', () => {
  test('exports the stable plugin identity and node kind', () => {
    expect(mezcalPlugin.id).toBe('thebossnow:mezcal')
    expect(mezcalPlugin.apiVersion).toBe(1)
    expect(mezcalPlugin.nodes?.map((definition) => definition.kind)).toEqual(['mezcal:site-plan'])
  })

  test('associates the Mezcal panel with the plugin', () => {
    expect(mezcalHostPanel.pluginId).toBe(mezcalPlugin.id)
    expect(mezcalHostPanel.defaultInstalled).toBe(false)
    expect(mezcalHostPanel.pluginUrl).toBe('https://github.com/thebossnow/mezcal_adapter_plugin')
  })
})
