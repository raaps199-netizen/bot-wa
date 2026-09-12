const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal'); // Tambahan library QR
const handleMessage = require('./handlers/messageHandler');

// --- INISIALISASI DATABASE JSON ---
// Disimpen DI DALAM folder auth_info biar numpang di Volume Railway yang sama
// (folder ini udah kebukti persist antar redeploy karena dipakai buat sesi WhatsApp)
const dbFilePath = path.join(__dirname, 'auth_info', 'database.json');

if (fs.existsSync(dbFilePath)) {
  try {
    const fileData = fs.readFileSync(dbFilePath, 'utf-8');
    global.db = JSON.parse(fileData);
  } catch (err) {
    console.error('Gagal membaca database.json, membuat database kosong...', err);
    global.db = {};
  }
} else {
  global.db = {};
}

// Pastikan struktur dasar database aman dari error undefined
if (!global.db.users) global.db.users = {};
if (!global.db.game) global.db.game = {};

// Fungsi global untuk menyimpan database secara otomatis ke file
global.saveDatabase = () => {
  try {
    // Jaga-jaga kalau folder auth_info belum sempet dibikin sama Baileys
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbFilePath, JSON.stringify(global.db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Gagal menyimpan database ke file:', err);
  }
};
// ---------------------------------

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Menampilkan QR Code di terminal jika belum terhubung
    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi terputus, mencoba menghubungkan ulang...', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot berhasil terhubung ke WhatsApp!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (!msg.key.fromMe) {
          await handleMessage(sock, msg);
        }
      }
    }
  });
}

startBot();
    
