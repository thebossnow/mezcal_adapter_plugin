# Mezcal adapter plugin

A [Pascal editor](https://editor.pascal.app) plugin that imports **Mezcal**
(the [aiblueprint-mcp](https://github.com/thebossnow/aiblueprint-mcp) site-plan
+ ADU-compliance MCP server) exports as a native scene node: 3D massing, a
floor-plan boundary/setback/footprint layer, and a read-only inspector
showing the resolved CA zoning envelope and pass/fail compliance report.

Structurally identical to a third-party plugin — it peer-depends on
`@pascal-app/{core,editor,viewer}`, `react`, `three`, and `zod`, and is
scaffolded directly from the [Nature plugin](https://github.com/pascalorg/plugin-trees)
(Pascal's first-party reference implementation). It imports nothing private.

```bash
git clone https://github.com/thebossnow/mezcal_adapter_plugin.git
cd mezcal_adapter_plugin
bun install
bun run check-types
bun test
```

Read [Create a plugin](https://editor.pascal.app/docs/developers/plugins) for
the public API walkthrough and host integration contract.

## What this is (and isn't) — Phase 1 scope

[aiblueprint-mcp](https://github.com/thebossnow/aiblueprint-mcp) is a Python
MCP server (stdio transport) that drafts code-compliant ADU site plans against
a layered CA zoning rule set (state → county → city → HOA), then exports
DXF/PNG/GeoJSON/IFC. Pascal plugins are sandboxed, client-side TS/React/
Three.js packages with no ability to spawn a process or make an undeclared
network call — and per the docs, a plugin manifest cannot request or register
a live server adapter to an external service; only a *reviewed host* can do
that. So this plugin does not talk to aiblueprint-mcp live.

**Phase 1 (this repo) is import-only:** run aiblueprint-mcp's `project.export_mezcal`
operation ([thebossnow/aiblueprint-mcp#35](https://github.com/thebossnow/aiblueprint-mcp/pull/35))
through your existing MCP client (Claude Desktop, etc.), and import the
resulting JSON — the shape `import.ts` validates as `MezcalExportV1` — into
Pascal via the **Mezcal** panel or a node's inspector. `examples/sample-lot.mezcal.json`
is a small hand-authored example; `examples/real-world-lot.mezcal.json` was
actually produced by `export_mezcal` against an L-shaped lot and is checked
against the parser/geometry/floorplan builders end-to-end in
`src/real-export.test.ts` — a regression test that catches schema drift
between the two repos. There are zero external network calls and no
account/OAuth data anywhere in this plugin, which keeps it out of the docs'
["Connected services and personal data"](https://editor.pascal.app/docs/developers/plugins#connected-services-and-personal-data)
review section entirely.

**Not yet implemented (tracked as follow-ups, not silently missing):**

- **Vertex editing.** The boundary/setback/footprint polygons are read-only,
  fixed at import (`floorplan.ts` deliberately omits `move-handle` /
  `floorplanAffordances` — see the comment there). Re-import to update.
- **Live round-trip (Phase 3, self-hosted only).** Asking Pascal's AI to
  regenerate a compliant layout in place would need aiblueprint-mcp to grow
  an HTTP/SSE transport (FastMCP supports this; it's stdio-only today) plus a
  Pascal *host* willing to review and mount a server adapter to it. Not
  something a plugin manifest alone can do, and out of scope for the public
  `editor.pascal.app` catalog under plugin API v1 — only viable if you run
  Pascal yourself via `npx @pascal-app/cli editor` and are your own reviewing
  host. See [`HOST_INTEGRATION.md`](./HOST_INTEGRATION.md) for the concrete
  plan.

## Structure

- **`schema.ts`** — `mezcal:site-plan`'s zod schema. Unlike the Nature
  plugin's point-placed `TreeNode` (a `position` + local geometry), this kind
  stores **absolute plan-space geometry** directly — the same pattern the
  built-in `SiteNode`/slab/ceiling kinds use. There's nothing to "place": the
  boundary *is* the geometry, fixed by the imported data.
- **`units.ts`** — the schema stores feet (the native unit of US
  residential/ADU zoning and of aiblueprint-mcp's own data); Pascal's scene/
  floorplan space is meters. Conversion happens once, at the render boundary,
  in `geometry.ts` / `floorplan.ts` — never silently in the schema.
- **`import.ts`** — `MezcalExportV1` (the bundle schema) and
  `parseMezcalExport`, a pure function from parsed JSON to a `SitePlanNode`
  patch. No File/DOM API, so it's unit-testable in isolation
  (`import.test.ts`).
- **`geometry.ts`** — pure `def.geometry`: a Three.js `Group` with a flat
  boundary pad, a setback-envelope outline tinted by `compliance.overall`,
  and one extruded mesh per footprint (color-coded existing/proposed/ADU). No
  `def.renderer` needed — per the docs, a kind can ship geometry-only and let
  the framework's generic renderer own selection/outline chrome.
- **`floorplan.ts`** — pure `def.floorplan`: the same data as SVG-renderable
  `FloorplanGeometry` (boundary/setback/footprint polygons + centroid
  labels), so the site plan shows up in the 2D view for free.
- **`parametrics.ts`** / **`import-field.tsx`** — the node's inspector: a
  `custom` field that re-imports an export into an existing node.
- **`requirements-panel.tsx`** — a read-only `trailingSection` rendering the
  resolved zoning envelope and compliance report exactly as aiblueprint-mcp
  returned them.
- **`panel.tsx`** — the "Mezcal" left-rail `EditorHostPanel`. Since the node
  has no placement tool, importing *is* creating: a successful parse builds
  a full node and calls `createNode` on the active level directly.
- **`definition.ts`** / **`index.ts`** — the `NodeDefinition` and the plugin
  manifest (`thebossnow:mezcal`, node kind `mezcal:site-plan`).
- **`host-adapter.ts`** — Phase 3 type scaffolding only (see
  `HOST_INTEGRATION.md`): the shape a future live-round-trip server adapter
  would implement. Not imported by `index.ts` or anything else in `src/`,
  not part of the plugin manifest, no runtime behavior.

## Manifest

```ts
import { mezcalPlugin } from 'mezcal-adapter-plugin'
// host:
setPluginDiscovery(async () => [mezcalPlugin])
```

The editor app separately imports `mezcalHostPanel` to surface the Mezcal
rail entry (`defaultInstalled: false` — unlike Nature, this isn't useful
until you actually have an aiblueprint-mcp export to import).

## Testing

`@react-three/{fiber,drei}` and `zustand` are in `devDependencies` even though
no file in `src/` imports them — `@pascal-app/core` needs them resolvable on
disk for its own internal modules (e.g. the elevator system) to load under
`bun test`/`tsc`. A real Pascal host already provides them; this plugin's own
peer-dependency contract stays limited to what `src/` actually imports.

Per the docs' plugin testing checklist:

- [x] Schema validated via zod (`schema.ts`, exercised by `import.test.ts`).
- [x] `geometry`/`floorplan` tested as pure functions (`geometry.test.ts`,
      `floorplan.test.ts`) — no renderer/DOM required.
- [x] Registry test confirming the manifest's node kind and panel wiring
      (`index.test.ts`).
- [x] Round-tripped a bundle actually produced by aiblueprint-mcp's
      `export_mezcal` (not hand-authored) through `parseMezcalExport` →
      `SitePlanNode.parse` → `buildSitePlanGeometry`/`buildSitePlanFloorplan`
      (`src/real-export.test.ts`).
- [ ] Load via `setPluginDiscovery` in a real Pascal host and confirm the
      dev console reports the plugin ID + node count. *(Confirmed not
      possible with public tooling today: the Pascal CLI's `editor` runtime
      has no plugin-discovery hook — `pascal plugin list` is read-only, and
      the docs say installation/catalog commands aren't in the current CLI
      release. Needs either a Pascal-reviewed host or Pascal's own source
      repo.)*
- [ ] Full project lifecycle (create → save → reload → uninstall →
      reinstall) in an actual Pascal editor session. *(Same blocker as
      above.)*

## Prepare-a-publishable-repository checklist

- [x] Namespaced plugin ID (`thebossnow:mezcal`), `apiVersion: 1`.
- [x] `@pascal-app/*`, react, three, zod as peer dependencies only.
- [x] Public repo, MIT license.
- [x] No install-time scripts, no undeclared network calls.
- [x] Lazy renderer/panel/import-field modules (`() => import(...)`) so
      loading plugin metadata doesn't pull in React/Three.js/the import UI.
- [x] Lockfile committed (`bun.lock`) — `check-types` and `test` both pass
      against it (`bun install && bun run check-types && bun test`).
- [ ] Immutable release tag — cut one before asking a Pascal host to review
      this.

## Credits

Scaffolded from [pascalorg/plugin-trees](https://github.com/pascalorg/plugin-trees)
(Nature), Pascal's first-party reference plugin, MIT licensed. Zoning/
compliance data model mirrors [thebossnow/aiblueprint-mcp](https://github.com/thebossnow/aiblueprint-mcp).
`HOST_INTEGRATION.md`'s Phase 3 design follows the precedent set by
[mintdotgg/mint-pascal-plugin](https://github.com/mintdotgg/mint-pascal-plugin)'s
own `HOST_INTEGRATION.md`.

## License

MIT.
