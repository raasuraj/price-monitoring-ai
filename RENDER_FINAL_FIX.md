# PMC Render Final Fix

This build explicitly serves `site/index.html` at `/` and exposes `/api/health`
with `dashboardExists` so the Render deployment can be verified.

Deployment:
1. Replace the files in the GitHub repository with this ZIP's files.
2. Commit to `main`.
3. Wait for Render Auto-Deploy to show **Live**.
4. Open the Render primary URL.
5. If needed, open `/api/health`; it should show `"ok":true` and `"dashboardExists":true`.
