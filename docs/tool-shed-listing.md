# Local Tool Shed listing proposal

`tool-shed-entry.json` is a preview entry matching the hub's `AppEntry` schema. It intentionally leaves `repo`, `launch`, and `verified` null because publication has not been authorized.

For a future authorized hub update, append this entry to `src/data/apps.json`, copy the two original screenshot files into `public/screenshots/apps/kata-app-inspired-by-trenchbroom-codex-dot/`, and run the hub's validators and browser review. Do not change unrelated app records.

The current Tool Shed checkout was not modified during this task. This proposal is packaged with the app so it can be integrated alongside the Tiled and QuickBASIC entries without competing edits.
