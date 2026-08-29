'use client'

import type { AnyNode, AnyNodeId } from '@pascal-app/core'
import { useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { useRef, useState } from 'react'
import { parseMezcalExport } from './import'
import { SitePlanNode } from './schema'

const KIND = 'mezcal:site-plan'

/**
 * The "Mezcal" left-rail panel — the only way to create a `mezcal:site-plan`
 * node in Phase 1 (see `definition.ts`: no placement tool, since there's
 * nothing to draw). Import is creation: a successfully parsed export becomes
 * a fully-formed node on the active level immediately.
 */
export default function MezcalPanel() {
  const activeLevelId = useViewer((s) => s.selection.levelId)
  const count = useScene((s) => Object.values(s.nodes).filter((n) => (n.type as string) === KIND).length)
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function createFromRaw(text: string, sourceFile?: string) {
    if (!activeLevelId) {
      setError('Select a level in the viewer before importing.')
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      setError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`)
      return
    }
    const result = parseMezcalExport(parsed, sourceFile)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError(null)
    setPasted('')
    const node = SitePlanNode.parse(result.patch)
    useScene.getState().createNode(node as unknown as AnyNode, activeLevelId as AnyNodeId)
    useViewer.getState().setSelection({ selectedIds: [node.id as AnyNodeId] })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file
      .text()
      .then((text) => createFromRaw(text, file.name))
      .catch((err) => setError(`Could not read file: ${err instanceof Error ? err.message : String(err)}`))
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 600, fontSize: 16 }}>Mezcal</h2>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{count} imported</span>
      </div>
      <p style={{ fontSize: 12, opacity: 0.8 }}>
        Import a site-plan/compliance export produced by{' '}
        <a href="https://github.com/thebossnow/aiblueprint-mcp" target="_blank" rel="noreferrer">
          aiblueprint-mcp
        </a>{' '}
        to add its boundary, setbacks, and footprints to the active level.
      </p>
      <button type="button" disabled={!activeLevelId} onClick={() => fileInputRef.current?.click()}>
        Import Mezcal export…
      </button>
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} hidden />
      <textarea
        placeholder="…or paste the exported JSON here"
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        rows={5}
      />
      <button type="button" disabled={!activeLevelId || !pasted.trim()} onClick={() => createFromRaw(pasted)}>
        Apply pasted JSON
      </button>
      {!activeLevelId && <div style={{ fontSize: 12, opacity: 0.7 }}>Select a level to enable import.</div>}
      {error && <div style={{ color: '#d9534f', fontSize: 12 }}>{error}</div>}
    </div>
  )
}
