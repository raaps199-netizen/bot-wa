async function terimaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = msg.key.participant || remoteJid;
  const senderId = rawSenderId.split(':')[0] + '@s.whatsapp.net';

  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif di chat ini.' }, { quoted: msg });
  }

  const targetChallenged = challenge.challenged.split(':')[0] + '@s.whatsapp.net';

  if (targetChallenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tantangan ini bukan buat lo, bro!' }, { quoted: msg });
  }

  const { challenger, challenged, bet } = challenge;

  // Fungsi helper buat motong poin dari properti mana aja yang ada isinya (mathScore / triviaScore / score)
  function deductUserScore(userId, amount) {
    const cleanTarget = userId.split(':')[0].split('@')[0];
    let foundKey = Object.keys(global.db.users || {}).find(k => k.includes(cleanTarget));

    if (!foundKey) {
      foundKey = userId;
      global.db.users[foundKey] = { mathScore: 0, triviaScore: 0, score: 0 };
    }

    let user = global.db.users[foundKey];
    let remaining = amount;

    // Potong dari triviaScore dulu kalau ada
    if (user.triviaScore && user.triviaScore > 0) {
      const take = Math.min(user.triviaScore, remaining);
      user.triviaScore -= take;
      remaining -= take;
    }
    // Kalau masih kurang, potong dari mathScore
    if (remaining > 0 && user.mathScore && user.mathScore > 0) {
      const take = Math.min(user.mathScore, remaining);
      user.mathScore -= take;
      remaining -= take;
    }
    // Kalau masih kurang juga, potong dari score utama
    if (remaining > 0 && user.score && user.score > 0) {
      const take = Math.min(user.score, remaining);
      user.score -= take;
      remaining -= take;
    }
  }

  // Eksekusi potong poin untuk challenger dan challenged
  deductUserScore(challenger, bet);
  deductUserScore(challenged, bet);

  delete global.db.remeChallenges[remoteJid];

  global.db.game[remoteJid] = {
    type: 'reme',
    players: [challenger, challenged],
    scores: { [challenger]: 0, [challenged]: 0 },
    currentTurnIndex: 0,
    round: 1,
    maxRound: 3,
    roundData: {},
    bet: bet
  };

  const starterName = challenger.split('@')[0];

  await sock.sendMessage(remoteJid, {
    text: `⚔️ *Tantangan Diterima & Poin Dipotong (${bet} Poin)*!\n\nPermainan Reme 3 Ronde dimulai!\nGiliran pertama melakukan *.spin* adalah: @${starterName}`,
    mentions: [challenger, challenged]
  }, { quoted: msg });
}

async function tolakCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = msg.key.participant || remoteJid;
  const senderId = rawSenderId.split(':')[0] + '@s.whatsapp.net';

  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif.' }, { quoted: msg });
  }

  const targetChallenged = challenge.challenged.split(':')[0] + '@s.whatsapp.net';

  if (targetChallenged !== senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Bukan hak lo buat nolak tantangan ini!' }, { quoted: msg });
  }

  delete global.db.remeChallenges[remoteJid];
  await sock.sendMessage(remoteJid, { text: `🏳️ Tantangan Reme ditolak. Cupu lu!` }, { quoted: msg });
}

module.exports = { terimaCommand, tolakCommand };
