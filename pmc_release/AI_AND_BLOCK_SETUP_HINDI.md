# PMC Data — Tehsil + Block + AI Document Fetch

## नया क्या है
- PMC 23 और Additional 18 में Tehsil के साथ **Block selector**.
- हर Tehsil/Block का data अलग save होगा.
- Reports में भी Tehsil + Block selection.
- PDF, image (JPG/PNG/WebP), Word और Excel/CSV upload के लिए **AI Data Fetch**.
- AI document को समझकर commodity rows और market prices को target PMC table में map करता है.
- AI Fetch के बाद table को verify करके **Save Changes** दबाना जरूरी है.
- पुराना OCR Fallback भी रखा गया है.

## AI चालू करने के लिए Render में Environment Variables
Render → Backend Service → Environment में:

- `AI_API_KEY` = आपका AI provider API key
- `AI_MODEL` = `gpt-5.6-luna` (या आपके provider का supported model)
- Optional: `AI_BASE_URL` = compatible Responses API endpoint

API key को HTML/JavaScript में कभी न डालें; केवल Render server environment में रखें.

## Deploy
1. इस ZIP को GitHub repository में upload/push करें.
2. Render में इसी repository से Web Service बनाएं.
3. Build: `npm install`
4. Start: `npm start`
5. Persistent Disk को `/var/data` पर mount करें और `DATA_DIR=/var/data` रखें.
6. `AI_API_KEY` और `AI_MODEL` set करें.
7. GitHub Pages frontend में backend URL वही रखें जो Render service देता है.

## AI की सीमा
AI बहुत तरह के documents को समझ सकता है, लेकिन खराब/धुंधली scan, handwritten data, बहुत बड़े documents या गलत commodity mapping में result को verify करना जरूरी है. Missing values को AI invent नहीं करना चाहिए; table में verify/edit करें.
