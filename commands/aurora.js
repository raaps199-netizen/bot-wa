// File: commands/aurora.js

// Simpan status event aurora global sementara di memory
global.serverAuroraEvent = global.serverAuroraEvent || { active: false, expiresAt: 0 };

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function auroraCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  // 🛡️ Validasi Owner (Mendukung No HP & LID sekaligus)
  const ownerPhone = '6289531307627';
  const ownerLid = '66477638029541';
  const isOwner = senderId.includes(ownerPhone) || senderId.includes(ownerLid);
  
  if (!isOwner) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Perintah ini khusus untuk Admin/Owner server!` 
    }, { quoted: msg });
  }

  // Ambil parameter durasi detik (default 300 detik / 5 menit jika kosong)
  let durationInSeconds = parseInt(args[0]);
  if (isNaN(durationInSeconds) || durationInSeconds < 10) {
    durationInSeconds = 300;
  }

  // Pesan Puisi Pembuka 1
  let sentMsg = await sock.sendMessage(remoteJid, { 
    text: `🌌 *[SERVER EVENT]*\n\n_Saat malam meraja dan bintang terdiam... langit mulai berbisik pelan..._` 
  });

  await delay(3000);

  // Edit ke Pesan Puisi 2
  await sock.sendMessage(remoteJid, { 
    text: `🌌 *[SERVER EVENT]*\n\n_Cahaya kuno mulai merajut takdir di atas cakrawala, menembus batas dimensi..._`,
    edit: sentMsg.key
  });

  await delay(4000);

  // Klimaks: Aurora Muncul!
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

  // Aktifkan Buff Luck Server 5x di Global Database
  global.serverAuroraEvent = {
    active: true,
    multiplier: 10,
    expiresAt: Date.now() + (durationInSeconds * 1000)
  };
}

module.exports = auroraCommand;
