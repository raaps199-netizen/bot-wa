const fs = require('fs');
const path = require('path');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const qrcode = require('qrcode-terminal');
const handleMessage = require('./handlers/messageHandler');

// ==========================================================
// DATABASE
// ==========================================================

const dbFilePath = path.join(
  __dirname,
  'auth_info',
  'database.json'
);

if (fs.existsSync(dbFilePath)) {
  try {
    const fileData =
      fs.readFileSync(
        dbFilePath,
        'utf-8'
      );

    global.db =
      JSON.parse(fileData);

  } catch (err) {

    console.error(
      'Gagal membaca database.json, membuat database kosong...',
      err
    );

    global.db = {};
  }

} else {
  global.db = {};
}

// Pastikan struktur database tersedia
if (!global.db.users) {
  global.db.users = {};
}

if (!global.db.game) {
  global.db.game = {};
}

// ==========================================================
// SAVE DATABASE
// ==========================================================

global.saveDatabase = () => {
  try {

    const dir =
      path.dirname(dbFilePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(
        dir,
        { recursive: true }
      );
    }

    fs.writeFileSync(
      dbFilePath,
      JSON.stringify(
        global.db,
        null,
        2
      ),
      'utf-8'
    );

  } catch (err) {

    console.error(
      'Gagal menyimpan database ke file:',
      err
    );
  }
};

// ==========================================================
// START BOT
// ==========================================================

async function startBot() {

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    'auth_info'
  );

  const sock =
    makeWASocket({
      logger: pino({
        level: 'silent'
      }),

      auth: state
    });

  // ========================================================
  // SAVE CREDENTIALS
  // ========================================================

  sock.ev.on(
    'creds.update',
    saveCreds
  );

  // ========================================================
  // CONNECTION
  // ========================================================

  sock.ev.on(
    'connection.update',
    (update) => {

      const {
        connection,
        lastDisconnect,
        qr
      } = update;

      // QR
      if (qr) {
        qrcode.generate(
          qr,
          { small: true }
        );
      }

      // Connection closed
      if (connection === 'close') {

        const shouldReconnect =
          lastDisconnect
            ?.error
            ?.output
            ?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          'Koneksi terputus, mencoba menghubungkan ulang...',
          shouldReconnect
        );

        if (shouldReconnect) {
          startBot();
        }

      }

      // Connection opened
      else if (
        connection === 'open'
      ) {

        console.log(
          '✅ Bot berhasil terhubung ke WhatsApp!'
        );
      }
    }
  );

  // ========================================================
  // MESSAGE HANDLER
  // ========================================================

  sock.ev.on(
    'messages.upsert',
    async (m) => {

      console.log(
        '📩 MESSAGE MASUK:',
        m.type,
        m.messages?.length || 0
      );

      if (m.type !== 'notify') {
        return;
      }

      for (
        const msg of m.messages
      ) {

        // Pesan bot sendiri normalnya diabaikan supaya tidak loop.
        // Tetapi response tombol native-flow di self-chat punya fromMe=true,
        // jadi response interactive tetap harus diteruskan ke handler.
        const rawMessageJson =
          JSON.stringify(msg.message || {});

        const hasButtonResponse =
          rawMessageJson.includes('interactiveResponseMessage') ||
          rawMessageJson.includes('buttonsResponseMessage') ||
          rawMessageJson.includes('listResponseMessage');

        if (msg.key.fromMe && !hasButtonResponse) {
          continue;
        }

        console.log(
          '➡️ MEMANGGIL handleMessage'
        );

        try {

          await handleMessage(
            sock,
            msg
          );

        } catch (err) {

          console.error(
            '❌ ERROR handleMessage:',
            err
          );
        }
      }
    }
  );
}

// ==========================================================
// RUN
// ==========================================================

startBot().catch(
  (err) => {
    console.error(
      '❌ ERROR FATAL BOT:',
      err
    );
  }
);
