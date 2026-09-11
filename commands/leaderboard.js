async function leaderboardCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  if (!remoteJid.endsWith('@g.us')) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Perintah ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
  }

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};

  try {
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants || [];

    let leaderboardData = participants.map(p => {
      const jid = p.id;
      const data = global.db.users[jid] || {};
      const math = data.mathScore || 0;
      const trivia = data.triviaScore || 0;
      const total = math + trivia;
      
      // Ambil nama dari pushName database atau potong nomor HP-nya
      const name = data.name || jid.split('@')[0];

      return { name, math, trivia, total };
    });

    // Urutkan dari total skor tertinggi ke terendah
    leaderboardData.sort((a, b) => b.total - a.total);

    let text = `🏆 *LEADERBOARD GRUP* 🏆\n\n`;
    leaderboardData.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      text += `${medal} *${user.name}*\n`;
      text += `   └ Math: ${user.math} | Trivia: ${user.trivia} | Total: *${user.total}*\n\n`;
    });

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  } catch (err) {
    console.error('Error leaderboard:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal memuat leaderboard grup.' }, { quoted: msg });
  }
}

module.exports = leaderboardCommand;

