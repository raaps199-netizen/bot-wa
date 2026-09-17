// File: commands/reset.js
const { getSenderId } = require('../utils/jid-utils');

async function handleResetCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);

  // Cek apakah yang mengetik adalah Owner/Admin bot
  const ownerPhone = '6289531307627';
  const ownerLid = '66477638029541';
  const isOwner = senderId.includes(ownerPhone) || senderId.includes(ownerLid);

  if (!isOwner) {
    return await sock.sendMessage(remoteJid, { 
      text: `❌ Perintah ini khusus buat **Admin/Owner** untuk melakukan Reset Season server!` 
    }, { quoted: msg });
  }

  const confirmation = args[0]?.toLowerCase();

  // Proteksi konfirmasi agar tidak kepencet reset server
  if (confirmation !== 'season' && confirmation !== 'permanen') {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ *PERINGATAN: MENUJU ERA BARU SEASON 1!* ⚠️\n\n` +
            `Perintah admin ini bakal mereset *SELURUH PLAYER* dari nol:\n` +
            `• Saldo, Dompet, & Bank seluruh pemain diset jadi 0\n` +
            `• Semua joran, tas, ikan, & item ludes\n` +
            `• Level Rebirth, title, & statistik dibersihkan total!\n\n` +
            `Kalau yakin mau buka lembaran baru, ketik:\n` +
            `📌 *.reset season*`
    }, { quoted: msg });
  }

  // --- EKSEKUSI RESET TOTAL (BERSIHKAN DATABASE USER) ---
  if (global.db) {
    // 1. Jika data user disimpan di dalam objek global.db.users
    if (global.db.users && typeof global.db.users === 'object') {
      global.db.users = {}; // Kosongkan total object users
    }

    // 2. Jika data user disimpan langsung sebagai key di root global.db (berdasarkan JID/Nomor)
    for (const key in global.db) {
      // Jangan hapus properti sistem penting
      if (['game', 'settings', 'group', 'users'].includes(key)) continue;
      
      // Jika key terlihat seperti ID user (mengandung angka panjang atau @)
      if (key.includes('@') || !isNaN(key) || typeof global.db[key] === 'object') {
        delete global.db[key];
      }
    }
  }

  // Simpan perubahan ke database file
  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  return await sock.sendMessage(remoteJid, {
    text: `🚀 *SEASON 1 RESMI DIBUKA!* 🏆\n\n` +
          `Database pemain telah dibersihkan secara total!\n` +
          `Semua saldo, joran, dan statistik sekarang kembali bersih dari nol.\n\n` +
          `_Selamat menyambut **Season 1**! Silakan cek leaderboard atau ketik .score untuk mulai berpetualang lagi._ ✨`,
    quoted: msg
  }, { quoted: msg });
}

module.exports = handleResetCommand;
