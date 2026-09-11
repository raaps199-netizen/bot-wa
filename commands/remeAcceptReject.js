async function terimaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif di chat ini.' }, { quoted: msg });
  }

  if (challenge.challenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tantangan ini bukan buat lo!' }, { quoted: msg });
  }

  // Hapus tantangan pending, mulai game sesi reme
  delete global.db.remeChallenges[remoteJid];

  global.db.game[remoteJid] = {
    type: 'reme',
    players: [challenge.challenger, challenge.challenged],
    scores: {
      [challenge.challenger]: 0,
      [challenge.challenged]: 0
    },
    currentTurnIndex: 0, // 0 = Challenger, 1 = Challenged
    round: 1,
    maxRound: 3,
    roundData: {} // Menyimpan sementara hasil spin per player di ronde ini
  };

  const starterName = challenge.challenger.split('@')[0];

  await sock.sendMessage(remoteJid, {
    text: `⚔️ *Tantangan Diterima!*\n\nPermainan Reme 3 Ronde dimulai!\nGiliran pertama melakukan *.spin* adalah: @${starterName}`,
    mentions: [challenge.challenger, challenge.challenged]
  }, { quoted: msg });
}

async function tolakCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif.' }, { quoted: msg });
  }

  if (challenge.challenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Bukan hak lo buat nolak tantangan ini!' }, { quoted: msg });
  }

  delete global.db.remeChallenges[remoteJid];
  await sock.sendMessage(remoteJid, { text: `🏳️ Tantangan Reme ditolak. Cupu lu!` }, { quoted: msg });
}

module.exports = { terimaCommand, tolakCommand };

