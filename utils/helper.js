/**
 * Helper utilities untuk manajemen database user, skor, dan taruhan game.
 */

function getUserData(db, userId) {
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = {
      mathScore: 0,
      triviaScore: 0,
      score: 0,
      nickname: null
    };
  }
  return db.users[userId];
}

/**
 * Menghitung total skor user (gabungan Math, Trivia, dan saldo/skor Judi).
 */
function getTotalScore(user) {
  const math = user.mathScore || 0;
  const trivia = user.triviaScore || 0;
  const score = user.score || 0;
  return math + trivia + score;
}

/**
 * Mengurangi poin user berdasarkan total skor yang tersedia.
 * Mengurangi dari field `score` agar total skor berkurang dengan benar 
 * tanpa merusak data mathScore dan triviaScore.
 */
function deductPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  const total = getTotalScore(user);

  if (total < amount) {
    return false; // Poin tidak cukup
  }

  user.score = (user.score || 0) - amount;
  return true;
}

/**
 * Menambahkan poin ke user (kemenangan judi).
 */
function addPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  user.score = (user.score || 0) + amount;
  return true;
}

/**
 * Parsing jumlah taruhan (angka, allin, half, dll).
 */
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

module.exports = {
  getUserData,
  getTotalScore,
  deductPoints,
  addPoints,
  parseBetAmount
};
