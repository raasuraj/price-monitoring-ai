Price Monitoring AI - PMC Updated v3

Features:
- Login page (Demo: admin / admin123)
- Menu page
- Dashboard
- PMC Data and PMC Additional pages
- PDF + Excel download buttons
- Downloaded PDF has the source-form style header based on the supplied PMC form:
  Price Collection Perform with commodity specifications
  Uttar Pradesh / Bulandshahr
  Data Entry Operator / Price Collector line
  Performa title
- Original supplied PDFs bundled under pmc/

Note: PDF/Excel generation uses browser CDN libraries (jsPDF, AutoTable, SheetJS), so internet access is required for those libraries unless bundled locally.


Live Data Architecture:
- This is a browser-based application.
- "Online Live" / "Browser Live Mode" means the Dashboard automatically refreshes from saved day-wise data in the browser (localStorage).
- Dashboard refresh interval: 5 seconds.
- Same-browser tabs/windows also receive localStorage changes immediately through the storage event.
- This is NOT shared real-time data between different computers/users.
- For true multi-user / multi-computer real-time data, the next phase should add a database + backend/server API (and optionally WebSocket/SSE for instant push updates).
