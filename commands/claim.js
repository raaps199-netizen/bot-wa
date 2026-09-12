const { getSenderId } = require('../utils/jid-utils'); // Sesuaikan path utils lu

module.exports = async function claimCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);
  if (!senderId) return;

  if (!global.db.users[senderId]) {
    global.db.users[senderId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  const user = global.db.users[senderId];
  const REWARD = Math.floor(Math.random() * (200 - 100 + 1)) + 100;
  const COOLDOWN = 24 * 60 * 60 * 1000; // 24 jam
  const now = Date.now();

  // Cek Cooldown
  if (user.lastClaim && (now - user.lastClaim) < COOLDOWN) {
    const timeLeft = COOLDOWN - (now - user.lastClaim);
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return await sock.sendMessage(remoteJid, { 
      text: `⏳ Sabar bre, lu udah ambil jatah.\nTunggu *${hours} jam ${minutes} menit* lagi buat claim berikutnya.` 
    }, { quoted: msg });
  }

  // Tambah poin ke salah satu dompet dasar (triviaScore)
  user.triviaScore = (user.triviaScore || 0) + REWARD;
  
  // SINKRONISASI TOTAL SCORE
  user.score = (user.mathScore || 0) + (user.triviaScore || 0);
  user.lastClaim = now;
  
  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, { 
    text: `🎁 *Daily Claim Berhasil!*\n\nLu dapet *+${REWARD} Poin*.\nTotal poin lu sekarang: *${user.score}*` 
  }, { quoted: msg });
};

