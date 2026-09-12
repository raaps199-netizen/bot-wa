// File: commands/remeAcceptReject.js
const { deductPoints } = require('../utils/helper');

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

  deductPoints(remoteJid, challenger, bet);
  deductPoints(remoteJid, challenged, bet);

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
