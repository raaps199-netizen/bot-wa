// File: commands/remeAcceptReject.js
const { deductPoints, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function terimaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif di chat ini.' }, { quoted: msg });
  }

  const targetChallenged = challenge.challenged;

  if (targetChallenged !== senderId && targetChallenged.split('@')[0] !== senderId.split('@')[0]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tantangan ini bukan buat lo, bro!' }, { quoted: msg });
  }

  const { challenger, challenged, bet } = challenge;

  deductPoints(global.db, challenger, bet);
  deductPoints(global.db, challenged, bet);

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
    text: `⚔️ *Tantangan Diterima & Saldo Dipotong (${formatRupiah(bet)})*!\n\nPermainan Reme 3 Ronde dimulai!\nGiliran pertama melakukan *.spin* adalah: @${starterName}`,
    mentions: [challenger, challenged]
  }, { quoted: msg });
}

async function tolakCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  const challenge = global.db?.remeChallenges?.[remoteJid];

  if (!challenge) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Nggak ada tantangan Reme yang aktif.' }, { quoted: msg });
  }

  const targetChallenged = challenge.challenged;

  if (targetChallenged !== senderId && targetChallenged.split('@')[0] !== senderId.split('@')[0]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Bukan hak lo buat nolak tantangan ini!' }, { quoted: msg });
  }

  delete global.db.remeChallenges[remoteJid];
  await sock.sendMessage(remoteJid, { text: `🏳️ Tantangan Reme ditolak. Cupu lu!` }, { quoted: msg });
}

module.exports = { terimaCommand, tolakCommand };
