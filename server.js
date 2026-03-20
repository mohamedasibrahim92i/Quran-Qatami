/**
 * Quran Radio Station — 24/7 Streaming Backend
 * Nasser Al-Qatami | All 114 Surahs | Continuous Loop
 * Made by Hima — نسألكم خالص الدعاء
 *
 * How it works:
 *  - Fetches each surah MP3 from everyayah.com CDN one by one
 *  - Pipes them sequentially into all connected HTTP clients (browsers)
 *  - Loops back to Surah 1 after Surah 114, forever
 *  - Exposes /stream  → audio/mpeg live stream
 *  - Exposes /status  → JSON with current surah info (for the frontend)
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const RECITER = 'nasser_al_qatami_128kbps';
const CDN_BASE = 'https://www.everyayah.com/data';

// ─── All 114 Surahs ───────────────────────────────────────────────
const SURAHS = [
  [1,'Al-Fatihah','الفاتحة'],[2,'Al-Baqarah','البقرة'],
  [3,"Ali 'Imran",'آل عمران'],[4,"An-Nisa'",'النساء'],
  [5,"Al-Ma'idah",'المائدة'],[6,"Al-An'am",'الأنعام'],
  [7,"Al-A'raf",'الأعراف'],[8,'Al-Anfal','الأنفال'],
  [9,'At-Tawbah','التوبة'],[10,'Yunus','يونس'],
  [11,'Hud','هود'],[12,'Yusuf','يوسف'],
  [13,"Ar-Ra'd",'الرعد'],[14,'Ibrahim','إبراهيم'],
  [15,'Al-Hijr','الحجر'],[16,'An-Nahl','النحل'],
  [17,"Al-Isra'",'الإسراء'],[18,'Al-Kahf','الكهف'],
  [19,'Maryam','مريم'],[20,'Taha','طه'],
  [21,"Al-Anbiya'",'الأنبياء'],[22,'Al-Hajj','الحج'],
  [23,"Al-Mu'minun",'المؤمنون'],[24,'An-Nur','النور'],
  [25,'Al-Furqan','الفرقان'],[26,"Ash-Shu'ara'",'الشعراء'],
  [27,'An-Naml','النمل'],[28,'Al-Qasas','القصص'],
  [29,"Al-'Ankabut",'العنكبوت'],[30,'Ar-Rum','الروم'],
  [31,'Luqman','لقمان'],[32,'As-Sajdah','السجدة'],
  [33,'Al-Ahzab','الأحزاب'],[34,"Saba'",'سبأ'],
  [35,'Fatir','فاطر'],[36,'Ya-Sin','يس'],
  [37,'As-Saffat','الصافات'],[38,'Sad','ص'],
  [39,'Az-Zumar','الزمر'],[40,'Ghafir','غافر'],
  [41,'Fussilat','فصلت'],[42,'Ash-Shura','الشورى'],
  [43,'Az-Zukhruf','الزخرف'],[44,'Ad-Dukhan','الدخان'],
  [45,'Al-Jathiyah','الجاثية'],[46,'Al-Ahqaf','الأحقاف'],
  [47,'Muhammad','محمد'],[48,'Al-Fath','الفتح'],
  [49,'Al-Hujurat','الحجرات'],[50,'Qaf','ق'],
  [51,'Adh-Dhariyat','الذاريات'],[52,'At-Tur','الطور'],
  [53,'An-Najm','النجم'],[54,'Al-Qamar','القمر'],
  [55,'Ar-Rahman','الرحمن'],[56,"Al-Waqi'ah",'الواقعة'],
  [57,'Al-Hadid','الحديد'],[58,'Al-Mujadila','المجادلة'],
  [59,'Al-Hashr','الحشر'],[60,'Al-Mumtahanah','الممتحنة'],
  [61,'As-Saf','الصف'],[62,"Al-Jumu'ah",'الجمعة'],
  [63,'Al-Munafiqun','المنافقون'],[64,'At-Taghabun','التغابن'],
  [65,'At-Talaq','الطلاق'],[66,'At-Tahrim','التحريم'],
  [67,'Al-Mulk','الملك'],[68,'Al-Qalam','القلم'],
  [69,'Al-Haqqah','الحاقة'],[70,"Al-Ma'arij",'المعارج'],
  [71,'Nuh','نوح'],[72,'Al-Jinn','الجن'],
  [73,'Al-Muzzammil','المزمل'],[74,'Al-Muddaththir','المدثر'],
  [75,'Al-Qiyamah','القيامة'],[76,'Al-Insan','الإنسان'],
  [77,'Al-Mursalat','المرسلات'],[78,"An-Naba'",'النبأ'],
  [79,"An-Nazi'at",'النازعات'],[80,"'Abasa",'عبس'],
  [81,'At-Takwir','التكوير'],[82,'Al-Infitar','الانفطار'],
  [83,'Al-Mutaffifin','المطففين'],[84,'Al-Inshiqaq','الانشقاق'],
  [85,'Al-Buruj','البروج'],[86,'At-Tariq','الطارق'],
  [87,"Al-A'la",'الأعلى'],[88,'Al-Ghashiyah','الغاشية'],
  [89,'Al-Fajr','الفجر'],[90,'Al-Balad','البلد'],
  [91,'Ash-Shams','الشمس'],[92,'Al-Layl','الليل'],
  [93,'Ad-Duha','الضحى'],[94,'Ash-Sharh','الشرح'],
  [95,'At-Tin','التين'],[96,"Al-'Alaq",'العلق'],
  [97,'Al-Qadr','القدر'],[98,'Al-Bayyinah','البينة'],
  [99,'Az-Zalzalah','الزلزلة'],[100,"Al-'Adiyat",'العاديات'],
  [101,"Al-Qari'ah",'القارعة'],[102,'At-Takathur','التكاثر'],
  [103,"Al-'Asr",'العصر'],[104,'Al-Humazah','الهمزة'],
  [105,'Al-Fil','الفيل'],[106,'Quraysh','قريش'],
  [107,"Al-Ma'un",'الماعون'],[108,'Al-Kawthar','الكوثر'],
  [109,'Al-Kafirun','الكافرون'],[110,'An-Nasr','النصر'],
  [111,'Al-Masad','المسد'],[112,'Al-Ikhlas','الإخلاص'],
  [113,'Al-Falaq','الفلق'],[114,'An-Nas','الناس'],
];

// ─── State ────────────────────────────────────────────────────────
let currentSurahIndex = 0;
let currentSurah = SURAHS[0];
let clients = new Set();         // all connected stream clients
let broadcastStarted = false;

function surahUrl(num) {
  const padded = String(num).padStart(3, '0');
  // Surah-level MP3 (full surah as one file)
  return `${CDN_BASE}/${RECITER}/${padded}001.mp3`;
}

// ─── Fetch one surah and pipe to all clients ──────────────────────
function streamSurah(index) {
  const surah = SURAHS[index];
  currentSurahIndex = index;
  currentSurah = surah;

  const url = surahUrl(surah[0]);
  console.log(`▶ Streaming Surah ${surah[0]}: ${surah[1]} (${surah[2]})`);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.warn(`  ✗ HTTP ${res.statusCode} for surah ${surah[0]}, skipping...`);
      res.resume();
      nextSurah(index);
      return;
    }

    res.on('data', (chunk) => {
      // Broadcast to every connected client
      for (const client of clients) {
        try { client.write(chunk); } catch (_) { clients.delete(client); }
      }
    });

    res.on('end', () => {
      console.log(`  ✓ Surah ${surah[0]} finished`);
      nextSurah(index);
    });

    res.on('error', (err) => {
      console.error(`  ✗ Stream error surah ${surah[0]}:`, err.message);
      nextSurah(index);
    });

  }).on('error', (err) => {
    console.error(`  ✗ Fetch error surah ${surah[0]}:`, err.message);
    setTimeout(() => nextSurah(index), 3000);
  });
}

function nextSurah(index) {
  const next = (index + 1) % SURAHS.length;
  if (next === 0) console.log('\n🔄 Full Quran completed — looping back to Al-Fatihah\n');
  streamSurah(next);
}

// ─── HTTP Server ──────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  console.log(`→ ${req.method} "${req.url}"`);  // visible in Render logs
  const url = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  // CORS for frontend on any domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── /stream — live audio ──
  if (url === '/stream' || url === '/stream/') {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // disable Nginx buffering on Render
      'icy-name': 'Quran Radio Station',
      'icy-genre': 'Quran Recitation',
      'icy-description': '24/7 Nasser Al-Qatami',
    });

    clients.add(res);
    console.log(`  + Listener connected (total: ${clients.size})`);

    req.on('close', () => {
      clients.delete(res);
      console.log(`  - Listener disconnected (total: ${clients.size})`);
    });

    // Start broadcasting on first client
    if (!broadcastStarted) {
      broadcastStarted = true;
      console.log('\n📻 Broadcast started!\n');
      streamSurah(0);
    }
    return;
  }

  // ── /status — current surah JSON ──
  if (url === '/status' || url === '/status/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      on_air: true,
      surah_number: currentSurah[0],
      surah_en: currentSurah[1],
      surah_ar: currentSurah[2],
      reciter: 'Nasser Al-Qatami',
      listeners: clients.size,
    }));
    return;
  }

  // ── / — health check ──
  if (url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Quran Radio Station is running. Listen at /stream');
    return;
  }

  res.writeHead(404); res.end(`Not found: "${url}" — try /stream or /status`);
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     📻  QURAN RADIO STATION  📻        ║
║   Sheikh Nasser Al-Qatami — 24/7       ║
║   Made by Hima — نسألكم خالص الدعاء   ║
╠════════════════════════════════════════╣
║  Stream  →  /stream                    ║
║  Status  →  /status                    ║
║  Port    →  ${PORT}                         ║
╚════════════════════════════════════════╝
`);
});
