# Render deployment fix

This build has been prepared for Render's Node.js runtime.

## Changes made
- Pinned Node.js to the 22.x line in `package.json`.
- Added `.node-version` with Node 22.
- Added `NODE_VERSION=22.0.0` to `render.yaml` so Render does not select Node 26.
- Pinned `better-sqlite3` to `11.10.0` instead of allowing a future version to be selected unexpectedly.
- Kept the existing SQLite database, Express server, dashboard files, Render disk, and environment variables unchanged.

## Deploy
Use the included `render.yaml` Blueprint or set the service to Node 22. Then deploy again.

The original error was during the native build of `better-sqlite3` under Node 26 (`node-gyp` / `make`). Node 22 is the intended runtime for this prepared build.
