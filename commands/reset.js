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
      text: `⚠️ *PERINGATAN: RESET SEASON GLOBAL SERVER!* ⚠️\n\n` +
            `Perintah ini akan mereset *SELURUH PLAYER* di dalam database ke titik nol:\n` +
            `• Uang dompet & Bank semua player jadi 0\n` +
            `• Joran, tas, ikan, umpan, potion, & fragment ludes\n` +
            `• Level Rebirth, title, dan statistik seluruh pemain di-reset total!\n\n` +
            `Jika kamu yakin ingin memulai **Season Baru**, ketik:\n` +
            `📌 *.reset season*`
    }, { quoted: msg });
  }

  // Loop dan reset seluruh data user yang ada di global.db
  if (global.db) {
    for (const key in global.db) {
      // Lewatkan key sistem global seperti 'game', 'settings', dll jika ada
      if (['game', 'settings', 'group'].includes(key)) continue;

      const user = global.db[key];
      if (user && typeof user === 'object') {
        user.points = 0;
        user.bank = 0;
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
  }

  if (typeof global.saveDatabase === 'function') {
    global.saveDatabase();
  }

  return await sock.sendMessage(remoteJid, {
    text: `🔄 *SEASON RESET BERHASIL DIEKSEKUSI!* 🚀\n\n` +
          `Seluruh data kekayaan, joran, tas, dan statistik semua pemain telah dibersihkan.\n` +
          `Selamat menyambut **Season Baru** dengan persaingan yang bersih dari nol! 🏆`,
    quotted: msg
  }, { quoted: msg });
}

module.exports = handleResetCommand;
      
