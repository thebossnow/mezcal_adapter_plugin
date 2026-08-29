'use client'

import { useRef, useState } from 'react'
import { parseMezcalExport } from './import'
import type { SitePlanNode } from './schema'

type Props = {
  node: SitePlanNode
  onUpdate: (patch: Partial<SitePlanNode>) => void
}

/**
 * The `custom` parametrics field that drives (re-)import — see
 * `parametrics.ts`. Accepts a `.json` file or pasted text, both produced by
 * running aiblueprint-mcp's `project`/`view.export` tools externally
 * (Phase 1 has no live connection to that server — see README).
 */
export default function ImportField({ node, onUpdate }: Props) {
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function applyRaw(text: string, sourceFile?: string) {
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
    onUpdate(result.patch)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file
      .text()
      .then((text) => applyRaw(text, file.name))
      .catch((err) => setError(`Could not read file: ${err instanceof Error ? err.message : String(err)}`))
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button type="button" onClick={() => fileInputRef.current?.click()}>
        {node.boundary.length > 0 ? 'Re-import Mezcal export…' : 'Import Mezcal export…'}
      </button>
      <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} hidden />
      <textarea
        placeholder="…or paste the exported JSON here"
        value={pasted}
        onChange={(e) => setPasted(e.target.value)}
        rows={4}
      />
      <button type="button" disabled={!pasted.trim()} onClick={() => applyRaw(pasted)}>
        Apply pasted JSON
      </button>
      {error && <div style={{ color: '#d9534f', fontSize: 12 }}>{error}</div>}
      {node.sourceFile && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Last imported: {node.sourceFile}
          {node.importedAt ? ` (${new Date(node.importedAt).toLocaleString()})` : ''}
        </div>
      )}
    </div>
  )
}
