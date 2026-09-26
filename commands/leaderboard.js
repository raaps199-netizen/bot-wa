// File: commands/leaderboard.js
const { getUserData, formatRupiah } = require('../utils/helper');

async function leaderboardCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  try {
    if (!global.db || !global.db.users) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Belum ada data pengguna di database!' }, { quoted: msg });
    }

    const usersArray = Object.entries(global.db.users).map(([userId, data]) => {
      return {
        userId,
        score: data.score || 0,
        nickname: data.nickname || userId.split('@')[0]
      };
    });

    usersArray.sort((a, b) => b.score - a.score);
    const topUsers = usersArray.slice(0, 10);

    if (topUsers.length === 0) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Belum ada data untuk leaderboard saat ini.' }, { quoted: msg });
    }

    let text = `🏆 *LEADERBOARD UTAMA SALDO & STATISTIK* 🏆\n\n`;
    topUsers.forEach((user, index) => {
      let medal = '';
      if (index === 0) medal = '🥇 ';
      else if (index === 1) medal = '🥈 ';
      else if (index === 2) medal = '🥉 ';
      else medal = `${index + 1}. `;

      text += `${medal}@${user.userId.split('@')[0]}\n`;
      text += `   💰 Saldo: *${formatRupiah(user.score)}*\n\n`;
    });

    text += `_Ketik .score untuk mengecek statistik pribadi kamu!_`;

    const mentions = topUsers.map(u => u.userId);

    await sock.sendMessage(remoteJid, {
      text: text.trim(),
      mentions: mentions
    }, { quoted: msg });

  } catch (err) {
    console.error('Error di leaderboardCommand:', err);
    await sock.sendMessage(remoteJid, { text: `❌ Terjadi kesalahan saat memuat leaderboard.` }, { quoted: msg });
  }
}

module.exports = leaderboardCommand;
