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
    const participantJids = new Set(participants.map(p => p.id));

    let leaderboardData = Object.entries(global.db.users).map(([jid, data]) => {
      const math = data.mathScore || 0;
      const trivia = data.triviaScore || 0;
      const gambling = data.score || 0;
      const total = math + trivia + gambling;
      
      const name = data.nickname || data.name || jid.split('@')[0];

      return { jid, name, math, trivia, gambling, total };
    });

    leaderboardData = leaderboardData.filter(user => user.total > 0 || participantJids.has(user.jid));

    if (leaderboardData.length === 0) {
      leaderboardData = participants.map(p => ({
        jid: p.id,
        name: p.id.split('@')[0],
        math: 0,
        trivia: 0,
        gambling: 0,
        total: 0
      }));
    }

    leaderboardData.sort((a, b) => b.total - a.total);

    let text = `🏆 *LEADERBOARD GRUP* 🏆\n\n`;
    leaderboardData.slice(0, 10).forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      text += `${medal} *${user.name}*\n`;
      text += `   └ Math: ${user.math} | Trivia: ${user.trivia} | Judi: ${user.gambling} | Total: *${user.total}*\n\n`;
    });

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  } catch (err) {
    console.error('Error leaderboard:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal memuat leaderboard grup.' }, { quoted: msg });
  }
}

module.exports = leaderboardCommand;
