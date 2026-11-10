# Brushkeep

**Make space for your next world.**

Brushkeep is an original Kata Tool Shed experiment inspired by [TrenchBroom](https://trenchbroom.github.io/). It is a small, browser-based level-blockout editor for practicing spatial design with solid cuboids. It is independent of TrenchBroom and reuses none of its source, branding, artwork, or game assets.

[← Kata Tool Shed](https://intrepion.github.io/tools/)

## Run locally

Requires Node 22 or newer. There are no npm runtime dependencies and no external asset requests.

```sh
npm run dev
```

Open **http://127.0.0.1:4173/** in a browser. Always serve the app over HTTP. Do not open HTML files directly or use `file://` URLs.

```sh
npm run check
npm run build
```

The static production app is written to `dist/`. Any static HTTP host can serve it. Nothing is published by the build. A `sites-preview` managed environment should run its preview daemon rather than starting a second competing server.

## What works

- Original “The quiet courtyard” scene with twelve solid brushes and two point markers.
- Orbitable orthographic 3D view and XY plan view, with independent zoom and pan.
- Draw grid-snapped rectangular brushes in top view, or add a default block.
- Select by clicking either viewport or the scene list.
- Drag a selected object on the XY plane. Edit exact XYZ position and width, depth, height in the inspector.
- Six original flat material colors applied to whole brushes.
- Player-start and point-light markers.
- Duplicate, delete, arrow-key nudging, and 80-edit undo/redo.
- Best-effort browser autosave, editable JSON save/open, file and pasted-JSON import.
- OBJ geometry export and **experimental** Quake standard MAP export.
- Replacement confirmations, validation, keyboard focus, responsive layouts, and local-only operation.

## Controls

| Action | Control |
| --- | --- |
| Select | V, or Select tool |
| Add block | +, =, or Add block button |
| Draw cuboid | B, then drag in top view |
| Orbit | Drag 3D view |
| Pan | Shift-drag either view (or middle-button drag) |
| Zoom | Mouse wheel |
| Move | Drag selected object in top view; arrow keys for grid nudges |
| Duplicate | Ctrl/⌘ D |
| Undo / redo | Ctrl/⌘ Z / Ctrl/⌘ Shift Z; Ctrl Y also redoes |
| Delete | Delete or Backspace outside fields |
| Save JSON | Ctrl/⌘ S |
| Reset cameras | Home view button |
| Focus selection | F, or target button |

One-finger touch gestures support orbiting, drawing, and moving. Use the inspector for precise mobile edits; multi-touch pinch gestures are not implemented. Canvas geometry has a corresponding keyboard-accessible scene list and numeric fields.

## Files and compatibility

### Brushkeep JSON

Lossless, editable app-native format with `format: "brushkeep"` and `version: 1`. Supports up to 400 objects and a 2 MB import limit. Objects must have unique IDs, valid material names, finite numeric coordinates within ±4,096 units, and positive dimensions. Full brush bounds must stay inside the world. Unknown fields are dropped. Invalid files do not replace the scene.

An unreadable or newer-version existing autosave is preserved, not overwritten by startup or ordinary edits. Explicitly loading/creating a scene resumes autosave.

Save a JSON file before closing the browser or clearing site data. Autosave uses localStorage scoped to this browser/origin; it can fail because of quotas, private browsing, or browser settings. Downloading is requested through the browser’s standard download flow. Verify your file was saved.

### OBJ

Z-up, untextured solid cuboids, eight vertices and six outward-wound quad faces per brush. Player/light markers, colors, and editable brush semantics are not included. A host application using Y-up may require a coordinate conversion. No OBJ import.

### Experimental Quake standard MAP

Worldspawn cuboids, `info_player_start`, and `light` point entities. Six planes define each cuboid. Exports placeholder texture names (`bk_stone`, `bk_basalt`, `bk_clay`, `bk_moss`, `bk_teal`, `bk_amber`) with default alignment; **texture assets are not included**. You must supply game-appropriate textures, inspect the map, and compile using external tooling. No WAD, BSP, compiler, engine, or playable output is included.

The text and winding are covered by browser unit tests, but the export has **not** been opened in TrenchBroom or compiled/run in a game engine. This is not a claim of verified native compatibility. Open-top starter geometry is a blockout, not a sealed playable Quake map. MAP import is not implemented.

## Deliberate limits

Axis-aligned cuboids only, no rotation, arbitrary convex brushes, CSG, clipping, vertex editing, face-level textures, UVs, texture imports, grouping, multiselect, collision, physics, lighting simulation, or gameplay. The orthographic 3D view uses a small original WebGL depth-buffered renderer when available, composited into the editor canvas. A software face-sorting fallback is used if WebGL is unavailable; intersecting geometry may display sorting artifacts in that fallback. Entities are visible markers and export data, not simulations. No server account, cloud storage, analytics, or collaboration.

## Tests

Run the HTTP server, then open **http://127.0.0.1:4173/tests/**. Model tests run in the browser and display their results. Click **Run UI tests** for DOM regression checks, including editing, validation, history, replacement confirmation, JSON paste import, and modal closure. The UI suite uses an editor iframe and restores the preceding browser autosave afterward.

`npm test` prints these browser-only instructions; it does not run or claim to run the suite. `npm run check` performs syntax checks, not behavioral tests. See [docs/TESTING.md](docs/TESTING.md) for observed results, gesture QA, and limitations.

## Design and source

- `src/model.js`: validated scene data, history, and file formats.
- `src/renderer.js` and `src/solid-renderer.js`: original orthographic renderer, WebGL solid pass, software fallback, and depth-aware hit testing.
- `src/app.js`: editor interactions, gestures, keyboard controls, import/export, and persistence.
- `tests/`: browser-served test bench; excluded from the production build.
- `app.json`: app metadata and screenshot provenance.
- `docs/tool-shed-entry.json`: proposed Tool Shed listing with preview status and no unverified public URL.

The TrenchBroom [official site](https://trenchbroom.github.io/) and [2026.2 reference manual](https://trenchbroom.github.io/manual/latest/) informed the high-level concept: brush editing, 3D plus 2D views, grid alignment, entities, undo, and standard plane-defined map geometry. The implementation and visual identity are original. Research date: 2026-11-10 UTC.

MIT-licensed. See [LICENSE](LICENSE).
