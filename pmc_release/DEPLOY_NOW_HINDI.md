# PMC Internet Live — Deploy Now

आपकी website को mobile + computer में एक ही shared data दिखाने के लिए यह project तैयार है।

## 1. Backend Render पर deploy करें

1. https://render.com खोलें और GitHub से Sign in करें।
2. इस ZIP को GitHub repository में upload करें। पूरी ZIP को सीधे GitHub में नहीं, बल्कि उसके files/folders को repository में रखें।
3. Render में **New + → Blueprint** चुनें।
4. अपनी GitHub repository चुनें। Render `render.yaml` पढ़कर service बनाएगा।
5. Service का नाम `pmc-internet-live` रखें।
6. `ADMIN_PASSWORD` में अपना नया admin password डालें।
7. Deploy करें।
8. Deploy होने के बाद URL सामान्यतः `https://pmc-internet-live.onrender.com` होगा। अगर Render कोई दूसरा URL देता है तो website में Settings/API Backend URL में वही URL डालें।

## 2. GitHub Pages frontend

आपकी existing GitHub Pages URL:
https://raasuraj.github.io/price-monitoring-Int/

अब default backend URL `https://pmc-internet-live.onrender.com` रखा गया है। इसलिए Render service इसी नाम से deploy करना सबसे आसान है।

## 3. जरूरी सुरक्षा

- `ADMIN_PASSWORD` को `admin123` न रखें।
- Twilio इस्तेमाल करना हो तभी `TWILIO_*` variables भरें।
- `SHOW_DEMO_OTP=false` रखा गया है।
- Database `/var/data/pmc.sqlite` में रखा जाएगा। Persistent disk उपलब्ध/सक्रिय होना जरूरी है, वरना server restart पर SQLite data खो सकता है।

## 4. Test

Computer पर login → कोई price बदलें → Save करें।

फिर mobile में वही GitHub Pages URL खोलें → login करें → वही changed data दिखना चाहिए।

## महत्वपूर्ण

GitHub Pages अकेले Node.js `server.js` नहीं चला सकता। इसलिए backend को अलग server पर चलाना जरूरी है।
