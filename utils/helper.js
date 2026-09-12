function getUserData(db, userId) {
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = {
      mathScore: 0,
      triviaScore: 0,
      score: 0, // Penampung poin net (menyatukan hasil judi ke total skor)
      nickname: null
    };
  }
  return db.users[userId];
}

// Menghitung Total Skor murni yang jadi acuan utama
function getTotalScore(user) {
  const math = user.mathScore || 0;
  const trivia = user.triviaScore || 0;
  const gamblingNet = user.score || 0;
  return math + trivia + gamblingNet;
}

// Cek dan potong langsung dari Total Skor
function deductPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  const total = getTotalScore(user);

  if (total < amount) return false; // Poin total tidak cukup

  // Kurangi dari field score agar Total Skor ikut berkurang
  user.score = (user.score || 0) - amount;
  return true;
}

// Tambah poin langsung ke Total Skor (kemenangan judi)
function addPoints(db, userId, amount) {
  const user = getUserData(db, userId);
  user.score = (user.score || 0) + amount;
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

module.exports = {
  getUserData,
  getTotalScore,
  deductPoints,
  addPoints,
  parseBetAmount
};
