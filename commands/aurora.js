// File: commands/aurora.js
const { getSenderId } = require('../utils/jid-utils');

// Simpan status event aurora global sementara di memory atau global.db
global.serverAuroraEvent = global.serverAuroraEvent || { active: false, expiresAt: 0 };

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function auroraCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  // 1. Validasi Owner / Admin (Opsional: Batasi hanya untuk owner bot)
  const ownerPhone = '6289531307627'; // Sesuaikan dengan nomor owner kamu
  const isOwner = rawSenderId.includes(ownerPhone);
  
  if (!isOwner) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Perintah ini khusus untuk Admin/Owner server!` 
    }, { quoted: msg });
  }

  // 2. Ambil parameter durasi detik (default 300 detik / 5 menit jika kosong)
  let durationInSeconds = parseInt(args[0]);
  if (isNaN(durationInSeconds) || durationInSeconds < 10) {
    durationInSeconds = 300; // Default 5 menit
  }

  // 3. Pesan Puisi Pembuka 1
  let sentMsg = await sock.sendMessage(remoteJid, { 
    text: `🌌 *[SERVER EVENT]*\n\n_Saat malam meraja dan bintang terdiam... langit mulai berbisik pelan..._` 
  });

  // Delay 1 detik
  await delay(1000);

  // Edit ke Pesan Puisi 2
  await sock.sendMessage(remoteJid, { 
    text: `🌌 *[SERVER EVENT]*\n\n_Cahaya kuno mulai merajut takdir di atas cakrawala, menembus batas dimensi..._`,
    edit: sentMsg.key
  });

  // Delay 1 detik lagi
  await delay(1000);

  // Edit ke Pesan Puisi 3 / Klimaks (Aurora Muncul!)
  const finalEventText = `
✨🌟 *AURORA CELESTIAL TELAH TIBA!* 🌟✨
━━━━━━━━━━━━━━━━━━━━━━
🔮 _Pancaran cahaya abadi menyelimuti seluruh lautan dan daratan server!_
⚡ *Efek Aktif:* Luck Server meningkat sebanyak **5x LIPAT**!
⏳ *Durasi Event:* Berlangsung selama *${durationInSeconds} detik* ke depan!

_Ayo segera pakai umpan terbaikmu dan ketik .mancing atau .lnj sekarang juga untuk panen ikan Divine!_
━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(remoteJid, { 
    text: finalEventText,
    edit: sentMsg.key
  });

  // 4. Aktifkan Buff Luck Server 5x di Global Database
  global.serverAuroraEvent = {
    active: true,
    multiplier: 5,
    expiresAt: Date.now() + (durationInSeconds * 1000)
  };
}

module.exports = auroraCommand;

