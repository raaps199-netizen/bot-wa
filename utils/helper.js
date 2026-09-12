// utils/helper.js

function deductPoints(db, userId, amount) {
  if (!db.users[userId]) {
    db.users[userId] = { mathScore: 0, triviaScore: 0, score: 0 }; // Sesuaikan nama field total skor utama
  }
  
  // Ambil dari total skor yang ada (misal gabungan atau field utama skor)
  const currentScore = db.users[userId].score || 0;
  db.users[userId].score = Math.max(0, currentScore - amount);
}

function addPoints(db, userId, amount) {
  if (!db.users[userId]) {
    db.users[userId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }
  
  const currentScore = db.users[userId].score || 0;
  db.users[userId].score = currentScore + amount;
}
