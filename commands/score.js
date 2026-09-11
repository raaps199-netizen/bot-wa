async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};

  const userData = global.db.users[senderId] || { mathScore: 0, triviaScore: 0 };
  const totalScore = (userData.mathScore || 0) + (userData.triviaScore || 0);
  
  // Prioritaskan nickname, lalu name, lalu pushName, lalu nomor HP
  const displayName = userData.nickname || userData.name || msg.pushName || senderId.split('@')[0];

  const text = 
`📊 *SKOR KAMU*

👤 Nama: *${displayName}*
🧮 Skor Math: *${userData.mathScore || 0}*
🧠 Skor Trivia: *${userData.triviaScore || 0}*
🏆 Total Skor: *${totalScore}*`;

  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

module.exports = scoreCommand;
