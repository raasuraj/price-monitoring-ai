# Render shared-data fix

The frontend now uses the same Render origin as its API by default (`window.location.origin`) instead of the old hard-coded backend URL.

This makes edits made on one phone sync to the same backend used by other phones.

Important: SQLite on Render Free uses the service filesystem and is not durable across service recreation/redeployment. For long-term permanent data, use a persistent database (e.g. Render Postgres) or persistent disk on a supported plan.
