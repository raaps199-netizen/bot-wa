// File: utils/helper.js

function getUserData(db, userId) {
  if (!db) global.db = {};
  if (!db.users) db.users = {};
  if (!userId) userId = 'unknown';

  if (!db.users[userId]) {
    db.users[userId] = {
      score: 0,         // Dompet utama untuk taruhan & admin add
      mathCount: 0,     // Statistik jumlah soal math yang diselesaikan
      triviaCount: 0,   // Statistik jumlah soal trivia yang diselesaikan
      nickname: null
    };
  }

  // Migrasi otomatis jika data lama masih pakai properti terpisah
  const user = db.users[userId];
  if (user.mathScore !== undefined || user.triviaScore !== undefined) {
    user.score = (user.score || 0) + (user.mathScore || 0) + (user.triviaScore || 0);
    delete user.mathScore;
    delete user.triviaScore;
  }
  if (user.mathCount === undefined) user.mathCount = 0;
  if (user.triviaCount === undefined) user.triviaCount = 0;

  return user;
}

function getTotalScore(user) {
  if (!user) return 0;
  return user.score || 0;
}

function addPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  user.score = (user.score || 0) + amount;
  return true;
}

function deductPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  if ((user.score || 0) < amount) return false;
  user.score = (user.score || 0) - amount;
  return true;
}

function parseBetAmount(arg, userTotalScore) {
  if (!arg) return null;
  const lower = arg.toString().toLowerCase();

  if (lower === 'all' || lower === 'allin' || lower === 'semua') {
    return userTotalScore > 0 ? userTotalScore : null;
  }
  if (lower === 'half' || lower === 'setengah') {
    return Math.floor(userTotalScore / 2);
  }

  const parsed = parseInt(arg, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

// 🔢 Helper Parser Angka Singkat (Contoh: 500k, 5jt, atau all)
function parseNumber(input, maxAvailable = 0) {
  if (!input) return 0;
  let str = input.toString().toLowerCase().trim();

  if (str === 'all' || str === 'allin' || str === 'semua') {
    return maxAvailable;
  }

  let multiplier = 1;
  if (str.endsWith('k')) {
    multiplier = 1000;
    str = str.slice(0, -1);
  } else if (str.endsWith('jt') || str.endsWith('juta')) {
    multiplier = 1000000;
    str = str.replace(/(jt|juta)$/, '');
  } else if (str.endsWith('m')) {
    multiplier = 1000000000;
    str = str.slice(0, -1);
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.floor(num * multiplier);
}

// 💵 Format angka ke tampilan Rupiah (contoh: 5000 -> Rp5.000)
function formatRupiah(amount) {
  return `Rp${Number(amount || 0).toLocaleString('id-ID')}`;
}

module.exports = {
  getUserData,
  getTotalScore,
  addPoints,
  deductPoints,
  parseBetAmount,
  parseNumber,
  formatRupiah
};
