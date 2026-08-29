/**
 * Phase 3 scaffolding only — see HOST_INTEGRATION.md for the plan this
 * shape belongs to. Not wired into the plugin manifest (`definition.ts` /
 * `index.ts`); nothing in `src/` imports this file. It exists so a future
 * implementer of the live-round-trip host adapter has a starting shape
 * rather than a blank page.
 */

/** Config a reviewing host would supply to the adapter — the operator's own
 * aiblueprint-mcp instance, not a fixed public endpoint (aiblueprint-mcp is
 * self-hosted, unlike e.g. Mint's hosted `api.mint.gg`). */
export interface MezcalHostAdapterConfig {
  /** Origin of the operator's aiblueprint-mcp HTTP/SSE transport, e.g.
   * "https://mezcal.example.internal". */
  mcpServerUrl: string
  requestTimeoutMs?: number
}

/** Signature a `/api/plugins/mezcal/[...path]` route handler would implement,
 * mirroring how Mint's `handleMintPascalRequest` is mounted by its host. */
export type MezcalHostRequestHandler = (
  request: Request,
  config: MezcalHostAdapterConfig,
) => Promise<Response>
