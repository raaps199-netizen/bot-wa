async function qqAcceptCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;
    const game = global.db.game?.[remoteJid];

    if (!game || game.type !== 'qq' || game.status !== 'pending') {
      await sock.sendMessage(remoteJid, { text: `⚠️ Tidak ada tantangan QQ yang menunggu untuk diterima di chat ini.` }, { quoted: msg });
      return;
    }

    if (senderId !== game.p2) {
      await sock.sendMessage(remoteJid, { text: `❌ Kamu bukan orang yang ditantang untuk duel ini!` }, { quoted: msg });
      return;
    }

    // Potong poin kedua pemain
    global.db.users[game.p1].score -= game.taruhan;
    global.db.users[game.p2].score -= game.taruhan;
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    game.status = 'playing';
    game.round = 1;
    game.turn = game.p1;
    game.scores = {
      [game.p1]: { wins: 0 },
      [game.p2]: { wins: 0 }
    };

    const p1Name = game.p1.split('@')[0];
    const p2Name = game.p2.split('@')[0];

    await sock.sendMessage(remoteJid, {
      text: `⚔️ *Tantangan Diterima & Poin Dipotong (${game.taruhan} Poin)*!\n\nPermainan QQ 3 Ronde dimulai!\nGiliran pertama melakukan *.spinqq* adalah: @${p1Name}`,
      mentions: [game.p1, game.p2]
    }, { quoted: msg });

  } catch (err) {
    console.error('Error di qqAcceptCommand:', err);
  }
}

async function qqRejectCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;
    const game = global.db.game?.[remoteJid];

    if (!game || game.type !== 'qq' || game.status !== 'pending') {
      await sock.sendMessage(remoteJid, { text: `⚠️ Tidak ada tantangan QQ yang bisa ditolak.` }, { quoted: msg });
      return;
    }

    if (senderId !== game.p2 && senderId !== game.p1) {
      text: `❌ Kamu tidak berhak membatalkan tantangan ini.`
      return;
    }

    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, { text: `❌ Tantangan QQ dibatalkan/ditolak.` }, { quoted: msg });

  } catch (err) {
    console.error('Error di qqRejectCommand:', err);
  }
}

module.exports = { qqAcceptCommand, qqRejectCommand };
