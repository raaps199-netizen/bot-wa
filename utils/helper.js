// File: utils/helper.js

/**
 * PERUBAHAN UTAMA (fix bug poin tidak berkurang):
 * 1. getUserData sekarang SELALU baca/tulis ke global.db.users[userId],
 *    tidak peduli remoteJid grup atau DM. Sebelumnya ada percabangan yang
 *    bikin data grup (@g.us) disimpan terpisah di global.db.groups[...],
 *    sedangkan command cek saldo & .qq baca dari global.db.users langsung.
 *    Itu yang bikin poin "ke-update" tapi di tempat yang gak pernah dibaca.
 * 2. addPoints/deductPoints sekarang langsung operasi ke field `score`,
 *    bukan lagi ke mathScore/triviaScore lalu overwrite score jadi
 *    penjumlahan keduanya. Karena struktur DB dasar cuma { score, nickname },
 *    field mathScore/triviaScore yang gak pernah keisi bikin score
 *    ke-reset jadi 0 tiap kali deductPoints/addPoints dipanggil.
 *
 * Kalau proyek lo MEMANG butuh skor terpisah per kategori (math/trivia),
 * jangan pakai versi ini mentah-mentah — bilang aja, nanti dibikinin
 * versi yang konsisten isi mathScore/triviaScore di SEMUA fitur (termasuk .qq).
 */

function getUserData(remoteJid, userId) {
  if (!userId) {
    return { score: 0, lastClaim: 0, nickname: '' };
  }

  global.db.users = global.db.users || {};

  if (!global.db.users[userId]) {
    global.db.users[userId] = {
      score: 0,
      lastClaim: 0,
      nickname: ''
    };
  }

  return global.db.users[userId];
}

function addPoints(remoteJid, userId, type, amount) {
  const user = getUserData(remoteJid, userId);
  user.score = (user.score || 0) + amount;
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return user.score;
}

function deductPoints(remoteJid, userId, amount) {
  const user = getUserData(remoteJid, userId);
  user.score = Math.max(0, (user.score || 0) - amount);
  if (typeof global.saveDatabase === 'function') global.saveDatabase();
  return user.score;
}

function parseBetAmount(args, userTotal) {
  const rawArg = args.find(arg => !arg.includes('@') && (!isNaN(arg) || ['all', 'all-in', 'semua'].includes(arg.toLowerCase())));
  if (!rawArg) return null;

  if (['all', 'all-in', 'semua'].includes(rawArg.toLowerCase())) {
    return userTotal;
  }

  const parsed = parseInt(rawArg);
  return isNaN(parsed) ? null : parsed;
}

module.exports = { getUserData, addPoints, deductPoints, parseBetAmount };
