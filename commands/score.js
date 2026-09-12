async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};

  const userData = global.db.users[senderId] || { mathScore: 0, triviaScore: 0, score: 0 };
  const math = userData.mathScore || 0;
  const trivia = userData.triviaScore || 0;
  const gambling = userData.score || 0;
  const totalScore = math + trivia + gambling;
  
  const displayName = userData.nickname || userData.name || msg.pushName || senderId.split('@')[0];

  const text = 
`📊 *SKOR KAMU*

👤 Nama: *${displayName}*
🧮 Skor Math: *${math}*
🧠 Skor Trivia: *${trivia}*
🎲 Saldo Judi: *${gambling}*
🏆 Total Skor: *${totalScore}*`;

  try {
    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  } catch (err) {
    console.error('Error di scoreCommand:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal memuat data skor.' }, { quoted: msg });
  }
}

module.exports = scoreCommand;
