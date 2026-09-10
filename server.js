const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const app = express();
// Allow the GitHub Pages frontend to call this API from another origin.
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin){res.setHeader('Access-Control-Allow-Origin', origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Credentials','true');}
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET,PUT,POST,OPTIONS');
  if(req.method==='OPTIONS') return res.sendStatus(204);
  next();
});
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'site');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'pmc.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL, updated_at TEXT NOT NULL)`);
db.exec(`CREATE TABLE IF NOT EXISTS otp (username TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at INTEGER NOT NULL, purpose TEXT DEFAULT 'login', mobile TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, mobile TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)`);
const defaultState = {};
const getState = db.prepare('SELECT state FROM app_state WHERE id=1');
const putState = db.prepare('INSERT INTO app_state(id,state,updated_at) VALUES(1,?,datetime(\'now\')) ON CONFLICT(id) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at');
function adminPassword(){return process.env.ADMIN_PASSWORD || 'admin123';}
function jsonState(){const row=getState.get(); if(!row) return defaultState; try{return JSON.parse(row.state)}catch{return defaultState}}
app.use(express.json({limit:'5mb'}));
app.use(express.static(PUBLIC_DIR));

function fetchJson(url){return new Promise((resolve,reject)=>{const lib=url.startsWith('https://')?https:http;const req=lib.get(url,{headers:{'User-Agent':'PMC-Internet-Live/1.0'}},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>{if(r.statusCode>=200&&r.statusCode<300){try{resolve(JSON.parse(b))}catch(e){reject(e)}}else reject(new Error('HTTP '+r.statusCode))})});req.on('error',reject);req.setTimeout(12000,()=>{req.destroy(new Error('timeout'))})})}
app.get('/api/live-prices',async(req,res)=>{const district=String(req.query.district||'Bulandshahr');const base=process.env.LIVE_PRICE_API_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';const key=process.env.DATA_GOV_API_KEY;try{if(!base)return res.json({ok:false,source:'not-configured',items:[]});let url=base;const sep=url.includes('?')?'&':'?';url+=sep+'format=json&limit=100';if(key)url+='&api-key='+encodeURIComponent(key);const data=await fetchJson(url);const rows=data.records||data.data||[];const items=rows.map(r=>({market:r.market||r.market_name||r.mandi||'',commodity:r.commodity||r.commodity_name||r.variety||'',price:r.modal_price??r.modal_price??r.price??r.retail_price??null,date:r.arrival_date||r.date||''})).filter(x=>x.market||x.commodity);const filtered=items.filter(x=>!district||JSON.stringify(x).toLowerCase().includes(district.toLowerCase()));res.json({ok:true,source:base,items:(filtered.length?filtered:items).slice(0,30),fetchedAt:new Date().toISOString()})}catch(e){res.status(502).json({ok:false,message:e.message,items:[]})}});

function hashPassword(password,salt){return crypto.scryptSync(String(password),salt,64).toString('hex')}
function makePasswordHash(password){const salt=crypto.randomBytes(16).toString('hex');return salt+':'+hashPassword(password,salt)}
function verifyPassword(password,stored){try{const [salt,hash]=String(stored).split(':');if(!salt||!hash)return false;const a=Buffer.from(hash,'hex'),b=Buffer.from(hashPassword(password,salt),'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}catch{return false}}
function normalizeMobile(m){let x=String(m||'').replace(/[\s-]/g,'');if(/^0\d{10}$/.test(x))x='+91'+x.slice(1);if(/^\d{10}$/.test(x))x='+91'+x;return /^\+91\d{10}$/.test(x)?x:x}
async function sendSmsOtp(mobile,code){
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN, from=process.env.TWILIO_FROM;
  if(!sid||!token||!from){ if(process.env.SHOW_DEMO_OTP==='false') throw new Error('SMS provider is not configured'); return {demoOtp:code,provider:'demo'} }
  const body=new URLSearchParams({To:mobile,From:from,Body:`PMC verification OTP: ${code}. Valid for 5 minutes.`});
  const auth=Buffer.from(`${sid}:${token}`).toString('base64');
  const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body});
  if(!r.ok) throw new Error('SMS gateway rejected the request');
  return {provider:'twilio'};
}

app.get('/api/health',(req,res)=>res.json({ok:true,service:'PMC Internet Live',time:new Date().toISOString()}));
app.post('/api/login',(req,res)=>{const {username,password}=req.body||{}; if(username==='admin' && password===adminPassword()) return res.json({ok:true}); const u=db.prepare('SELECT * FROM users WHERE username=?').get(String(username||'').trim()); if(u&&verifyPassword(password,u.password_hash)) return res.json({ok:true}); res.status(401).json({ok:false,message:'Invalid username/password'});});
app.post('/api/register/request-otp',async(req,res)=>{const {username,password}=req.body||{};const mobile=normalizeMobile(req.body?.mobile);if(!username||!mobile||!password||String(password).length<6)return res.status(400).json({ok:false,message:'Username, valid mobile and 6+ character password required'});if(username==='admin')return res.status(409).json({ok:false,message:'This username is reserved'});if(db.prepare('SELECT 1 FROM users WHERE username=? OR mobile=?').get(String(username).trim(),mobile))return res.status(409).json({ok:false,message:'Username or mobile already registered'});const code=String(crypto.randomInt(100000,1000000));db.prepare('INSERT INTO otp(username,code,expires_at,purpose,mobile) VALUES(?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET code=excluded.code,expires_at=excluded.expires_at,purpose=excluded.purpose,mobile=excluded.mobile').run(String(username).trim(),code,Date.now()+5*60*1000,'register',mobile);try{const sms=await sendSmsOtp(mobile,code);res.json({ok:true,message:'OTP आपके mobile number पर भेज दिया गया है।',demoOtp:sms.demoOtp})}catch(e){res.status(502).json({ok:false,message:'SMS OTP भेजने में समस्या: '+e.message})}});
app.post('/api/register/verify',(req,res)=>{const {username,password,otp}=req.body||{};const mobile=normalizeMobile(req.body?.mobile);const u=String(username||'').trim();const row=db.prepare('SELECT * FROM otp WHERE username=?').get(u);if(!row||row.purpose!=='register'||row.mobile!==mobile||row.code!==String(otp)||row.expires_at<=Date.now())return res.status(401).json({ok:false,message:'OTP गलत या expired है।'});if(db.prepare('SELECT 1 FROM users WHERE username=? OR mobile=?').get(u,mobile))return res.status(409).json({ok:false,message:'Username or mobile already registered'});db.prepare('INSERT INTO users(username,mobile,password_hash,created_at) VALUES(?,?,?,datetime(\'now\'))').run(u,mobile,makePasswordHash(password));db.prepare('DELETE FROM otp WHERE username=?').run(u);res.json({ok:true,message:'Registration successful. अब login कर सकते हैं।'});});
app.post('/api/otp/request',async(req,res)=>{const identifier=String((req.body||{}).username||'').trim();const u=identifier==='admin'?null:db.prepare('SELECT * FROM users WHERE username=? OR mobile=?').get(identifier,normalizeMobile(identifier));if(identifier!=='admin'&&!u)return res.status(404).json({ok:false,message:'User not found'});const username=u?.username||'admin',mobile=u?.mobile||process.env.ADMIN_MOBILE;if(!mobile)return res.status(400).json({ok:false,message:'Admin mobile OTP configured नहीं है।'});const code=String(crypto.randomInt(100000,1000000));db.prepare('INSERT INTO otp(username,code,expires_at,purpose,mobile) VALUES(?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET code=excluded.code,expires_at=excluded.expires_at,purpose=excluded.purpose,mobile=excluded.mobile').run(username,code,Date.now()+5*60*1000,'login',mobile);try{const sms=await sendSmsOtp(mobile,code);res.json({ok:true,message:'OTP आपके registered mobile पर भेज दिया गया है।',demoOtp:sms.demoOtp})}catch(e){res.status(502).json({ok:false,message:'SMS OTP भेजने में समस्या: '+e.message})}});
app.post('/api/otp/verify',(req,res)=>{const identifier=String((req.body||{}).username||'').trim(),otp=String((req.body||{}).otp||'');const u=db.prepare('SELECT username FROM users WHERE username=? OR mobile=?').get(identifier,normalizeMobile(identifier));const username=u?.username||identifier;const row=db.prepare('SELECT * FROM otp WHERE username=?').get(username);if(row&&row.purpose==='login'&&row.code===otp&&row.expires_at>Date.now()){db.prepare('DELETE FROM otp WHERE username=?').run(username);return res.json({ok:true});}res.status(401).json({ok:false,message:'OTP invalid or expired'});});
app.get('/api/state',(req,res)=>res.json({state:jsonState()}));
app.put('/api/state',(req,res)=>{const state=(req.body||{}).state; if(!state || typeof state!=='object') return res.status(400).json({ok:false,message:'Invalid state'}); putState.run(JSON.stringify(state)); res.json({ok:true,updatedAt:new Date().toISOString()});});
app.get('/{*splat}',(req,res)=>res.sendFile(path.join(PUBLIC_DIR,'index.html')));
app.listen(PORT,()=>console.log(`PMC running on port ${PORT}`));
