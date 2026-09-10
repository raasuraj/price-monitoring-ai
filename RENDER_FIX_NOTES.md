# Render deployment fix

This project was updated to avoid the `better-sqlite3` native build failure seen when Render used Node 26.

## Changes
- Node is pinned to the 22.x LTS line via `package.json` and `.node-version`.
- `better-sqlite3` is pinned to `11.10.0` instead of a floating `^11.10.0` dependency.
- Render build command uses `npm install --no-audit --no-fund`.
- `.npmrc` enables `engine-strict` so an incompatible Node version is not silently used.

## Render settings
Use the included `render.yaml`, or set:
- Runtime: Node
- Build Command: `npm install --no-audit --no-fund`
- Start Command: `npm start`

Do not add Node 26 manually. If an old Render service still shows Node 26, redeploy after pulling this version of the project (or recreate the service from the updated Blueprint).
