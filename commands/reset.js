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
            `• Dompet & Bank seluruh pemain diset jadi 0\n` +
            `• Semua joran, tas, ikan, & item ludes\n` +
            `• Level Rebirth, title, & statistik dibersihkan total!\n\n` +
            `Kalau yakin mau buka lembaran baru, ketik:\n` +
            `📌 *.reset season*`
    }, { quoted: msg });
  }

  // Fungsi helper untuk mereset data user secara menyeluruh
  function resetUserObj(user) {
    if (user && typeof user === 'object') {
      user.points = 0;
      user.bank = 0;
      user.balance = 0;
      user.money = 0;
      user.activeRod = 'training';
      user.rods = { training: true };
      user.inventory = {};
      user.rebirthLevel = 0;
      user.moneyMultiplier = 1;
      user.bossDamageMultiplier = 1;
      user.title = 'Novice';
      delete user.equippedTitle;
      user.maxPoin = 0;
      user.remeWin = 0;
      user.qqWin = 0;
      user.triviaCount = 0;
      user.mathCount = 0;
      user.totalFish = 0;
      user.bossKills = 0;
    }
  }

  // Eksekusi pembersihan database
  if (global.db) {
    // 1. Jika data user disimpan di dalam objek global.db.users
    if (global.db.users && typeof global.db.users === 'object') {
      for (const uid in global.db.users) {
        resetUserObj(global.db.users[uid]);
      }
    }

    // 2. Jika data user disimpan langsung sebagai key di global.db
    for (const key in global.db) {
      if (['game', 'settings', 'group', 'users'].includes(key)) continue;
      const user = global.db[key];
      if (user && typeof user === 'object') {
        resetUserObj(user);
      }
    }
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  return await sock.sendMessage(remoteJid, {
    text: `🚀 *SEASON 1 RESMI DIBUKA!* 🏆\n\n` +
          `Lembaran baru telah dimulai! Seluruh kekayaan, joran, dan statistik server telah dibersihkan dari nol.\n\n` +
          `_Sudah saatnya buktikan siapa yang bakal jadi legenda terkuat di **Season 1** ini. Selamat berjuang kembali dari garis start, para ksatria!_ ✨`,
    quoted: msg
  }, { quoted: msg });
}

module.exports = handleResetCommand;
