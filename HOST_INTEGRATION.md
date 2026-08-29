# Pascal Host Integration: Live Round-Trip (Phase 3)

**Status: planning only — nothing below is implemented.** This document
describes what a *reviewing host* would need to build to let this plugin
talk to a live aiblueprint-mcp instance instead of the static-import flow
described in the main [README](./README.md#what-this-is-and-isnt--phase-1-scope).

**Scope.** This needs a host whose server code the operator can actually
extend — running Pascal from its own source repo, not the stock
`npx @pascal-app/cli editor` release. Per this repo's own testing notes
(README), that CLI's `editor` runtime has no plugin-discovery hook and no
documented way to mount a custom API route today, so it can't host the
adapter route below on its own. It is out of scope for the public
`editor.pascal.app` catalog under plugin API v1 either way: per Pascal's
plugin docs, a plugin manifest cannot request or register a live server
adapter to an external service; only a reviewed host can do that.

This design follows the precedent set by
[`mintdotgg/mint-pascal-plugin`](https://github.com/mintdotgg/mint-pascal-plugin)'s
own `HOST_INTEGRATION.md`, which documents exactly this kind of live,
host-mounted adapter for a different Pascal plugin (Mint's 3D asset
library). The shape below adapts that pattern to this plugin's actual
constraints, which differ from Mint's in one important way: aiblueprint-mcp
is a **self-hosted MCP server** the operator runs themselves, not a hosted
SaaS with its own OAuth provider.

## Prerequisite: an HTTP/SSE transport

aiblueprint-mcp is stdio-only today. FastMCP (the framework it's built on)
already supports HTTP/SSE transports, so this is additive work in that repo,
not a rewrite — but it's a prerequisite, not something this plugin can work
around.

## Server adapter registration

The host creates a catch-all API route and delegates to a handler this
plugin package would export:

```
Create /api/plugins/mezcal/[...path]:
  import { handleMezcalPascalRequest } from 'mezcal-adapter-plugin/server'
  export { handleMezcalPascalRequest as GET, handleMezcalPascalRequest as POST }
```

The plugin owns the request-handling logic (translating Pascal-side
requests into aiblueprint-mcp MCP calls and back); the host only mounts the
route and supplies its own origin. See `src/host-adapter.ts` for the
`MezcalHostRequestHandler` type this handler would implement.

## Network access

Unlike Mint, which talks to fixed public endpoints (`api.mint.gg`,
`mcp.mint.gg`), aiblueprint-mcp has no public hosted instance — every
operator runs their own. So there's no domain to bake into this plugin.

The browser only ever calls the same-origin `/api/plugins/mezcal/[...path]`
route; the outbound call to aiblueprint-mcp happens server-side, inside
`handleMezcalPascalRequest`. That's a different case from Mint's CSP note
(Mint's browser code fetches asset files directly from `cdn.mint.gg`, so
*that* needs a CSP allowance) — here, browser CSP doesn't govern the
adapter's server-to-server request at all, and adding the MCP origin to it
would do nothing. Instead:

- The host operator supplies their aiblueprint-mcp origin as adapter config
  (`MezcalHostAdapterConfig.mcpServerUrl` in `src/host-adapter.ts`), the same
  way they'd configure any other self-hosted service.
- The host's *server-side* network egress (firewall rules, an allowlist for
  outbound requests, whatever the deployment uses) needs to permit reaching
  that operator-supplied origin. Because it's operator-specific, this is a
  host configuration step, not something the plugin manifest can declare
  statically.

## Authentication

aiblueprint-mcp has no accounts today — it's a local MCP server a user's own
client (Claude Desktop, etc.) talks to over stdio. For the common case
(operator runs aiblueprint-mcp on the same trusted network as their Pascal
host), no OAuth or token exchange is needed at all: the adapter route is the
only thing between Pascal and aiblueprint-mcp's HTTP/SSE endpoint.

If aiblueprint-mcp is ever run somewhere the host doesn't fully trust the
network path to, adopt Mint's pattern rather than inventing a new one:
tokens stay in host-only HttpOnly cookies, never returned to browser
JavaScript, and Pascal itself holds no aiblueprint-mcp secret — only the
adapter route does.

## What this plugin would still not do

Even with a live adapter, this stays a Phase 3 *round-trip* feature, not a
replacement for Phase 1 import: the plugin's own manifest and node
definition (`src/definition.ts`, `src/index.ts`) would remain unchanged.
Only a new adapter module (implementing `MezcalHostRequestHandler`) and the
host's route registration are additive — nothing here proposes touching the
existing static-import path.
