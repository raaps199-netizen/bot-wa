const { getUserData, getTotalScore } = require('../utils/helper');

async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};

  try {
    const user = getUserData(global.db, senderId);
    const math = user.mathScore || 0;
    const trivia = user.triviaScore || 0;
    const totalScore = getTotalScore(user);
    
    const displayName = user.nickname || user.name || msg.pushName || senderId.split('@')[0];

    const text = 
`📊 *SKOR KAMU*

👤 Nama: *${displayName}*
🧮 Skor Math: *${math}*
🧠 Skor Trivia: *${trivia}*
🏆 Total Skor: *${totalScore}*`;

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  } catch (err) {
    console.error('Error di scoreCommand:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal memuat data skor.' }, { quoted: msg });
  }
}

module.exports = scoreCommand;
