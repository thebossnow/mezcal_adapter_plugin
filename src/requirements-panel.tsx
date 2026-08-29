import type { SitePlanNode } from './schema'

const CHECK_LABEL: Record<string, string> = {
  area: 'Footprint area',
  setbacks: 'Setbacks',
  coverage: 'Lot coverage',
  height: 'Ridge height',
}

const OVERALL_COLOR: Record<'pass' | 'fail' | 'unknown', string> = {
  pass: '#3aa76d',
  fail: '#d9534f',
  unknown: '#8a8f98',
}

/**
 * Read-only inspector `trailingSection` — the resolved zoning envelope and
 * the compliance report, exactly as aiblueprint-mcp's `compliance.requirements`
 * / `compliance.report` returned them. No editing here: the source of truth
 * is the Mezcal export (`import-field.tsx` re-imports to refresh it).
 */
export default function RequirementsPanel({ node }: { node: SitePlanNode }) {
  const req = node.requirements
  const hasRequirements =
    req.setbackFrontFt !== undefined ||
    req.setbackRearFt !== undefined ||
    req.setbackSideFt !== undefined ||
    req.maxHeightFt !== undefined ||
    req.maxCoveragePct !== undefined ||
    req.maxSqft !== undefined

  if (!hasRequirements && !node.compliance && node.warnings.length === 0 && node.notes.length === 0) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
      {hasRequirements && (
        <div>
          <strong>Zoning envelope</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {req.setbackFrontFt !== undefined && <li>Front setback: {req.setbackFrontFt} ft</li>}
            {req.setbackRearFt !== undefined && <li>Rear setback: {req.setbackRearFt} ft</li>}
            {req.setbackSideFt !== undefined && <li>Side setback: {req.setbackSideFt} ft</li>}
            {req.maxHeightFt !== undefined && <li>Max height: {req.maxHeightFt} ft</li>}
            {req.maxCoveragePct !== undefined && <li>Max lot coverage: {req.maxCoveragePct}%</li>}
            {req.maxSqft !== undefined && <li>Max sq ft: {req.maxSqft}</li>}
          </ul>
        </div>
      )}

      {node.compliance && (
        <div>
          <strong style={{ color: OVERALL_COLOR[node.compliance.overall] }}>
            Compliance: {node.compliance.overall.toUpperCase()}
          </strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {(['area', 'setbacks', 'coverage', 'height'] as const).map((key) => {
              const check = node.compliance?.[key]
              if (!check) return null
              return (
                <li key={key} style={{ color: check.ok ? '#3aa76d' : '#d9534f' }}>
                  {CHECK_LABEL[key]}: {check.ok ? 'OK' : 'FAIL'}
                  {check.message ? ` — ${check.message}` : ''}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {node.warnings.length > 0 && (
        <div>
          <strong>Warnings</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {node.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {node.notes.length > 0 && (
        <div>
          <strong>Notes</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
            {node.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
