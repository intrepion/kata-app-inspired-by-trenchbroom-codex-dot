# Brushkeep verification

Verified 2026-11-10 UTC. All interactive tests and screenshots used the managed HTTP server at **http://127.0.0.1:4173/** in Chrome. No `file://` preview or direct HTML-file testing.

## Passed

- `npm run check`: syntax checks for the model, interaction controller, canvas renderer, WebGL solid renderer, local server, and browser test suite.
- `npm run build`: self-contained static production assets generated in `dist/`.
- **65 browser-served tests passed, zero failures** at `/tests/`: 42 model/rendering tests and 23 DOM interaction tests. The final suite ran after the renderer framing and stable canvas-layout fixes.
- Model coverage: project round-trip, strict import/schema validation, unique IDs, numeric/world/size limits, inherited-property rejection, rectangle snapping, bounded history, no-op/failed edits, redo invalidation, OBJ counts/outward winding, MAP plane count/Quake winding/point classes, scene replacement undo, foreground brush depth picking, actual rendered surface color, focus/home transforms.
- UI coverage: selection, add/edit, invalid-value rollback, materials, duplicate/delete/history, entity inspector, safe names, draw mode, replacement confirm/cancel, JSON paste import/errors, export disclosure and modal closure, unreadable/newer-version autosave preservation and explicit recovery.
- Native pointer gestures: drew a new 128 × 96 × 96 brush, dragged it on the XY grid from (288, −128) to (240, 16), then verified undo restored (288, −128). Orbited the 3D scene and inspected the changed view.
- Reload preserved the edited 15-object scene.
- Native downloads completed for Brushkeep JSON, OBJ and MAP. The downloaded JSON was opened through the app’s file chooser after clearing the scene, confirmed, and restored the 15-object scene.
- Final production build at `/dist/` rendered the original courtyard successfully.
- Responsive iframe checks at **320 and 390 CSS pixels** reported **zero horizontal overflow**. The 390-pixel layout was visually reviewed. These are browser layout tests, not physical-phone tests.
- No application-origin JavaScript console errors were observed in the final app check.

## Visual fixes caught during QA

A simple face-sorting renderer initially allowed a large floor face to obscure a raised terrace. It was replaced with a small original WebGL depth-buffered solid pass and depth-aware hit testing, with three browser rendering regressions. A conservative software fallback remains available if WebGL cannot initialize.

Canvas bitmap dimensions initially influenced flex sizing during full-page captures. Canvases now sit in explicitly sized grid panes with absolute positioning, keeping bitmap dimensions out of layout. Final runtime was rebuilt and the 65-test suite re-run.

## Screenshot evidence

`app.json` records original screenshots, exact dimensions, SHA-256 hashes, and provenance.

- `screenshots/brushkeep-desktop.jpg`: final local production build, desktop viewport. The plan view below the fold is not included.
- `screenshots/brushkeep-narrow.jpg`: 390-pixel app iframe inside the responsive QA page. The wider image includes the QA page background and width/overflow controls.

Chrome’s full-page/clip screenshot API repeatedly timed out late in the run; the documented native viewport capture succeeded. These are honest viewport captures, not assembled full-page images. There was no application blocker, and the ordinary interactive review and tests passed.

## Not verified / limits

- MAP was not opened in TrenchBroom, compiled to BSP, or run in a game engine. It remains **experimental**. The open-top starter is not a sealed Quake map, and placeholder textures require user-supplied assets.
- No OBJ host-application interoperability test; the exporter structure, winding and actual download were verified.
- No physical mobile/touch or browser-matrix testing, no synthetic multi-touch stress suite, no performance benchmark at the 400-object limit, and no forced WebGL-unavailable session.
- Browser autosave is best-effort storage, not a portable backup. File downloads are browser-managed.
- Not published. No remote repository, Pages deployment or public URL is claimed.
