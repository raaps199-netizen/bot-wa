// File: commands/qqAcceptReject.js
const { getUserData, addPoints, deductPoints } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function qqAcceptCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  if (!global.db?.qqChallenges?.[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tidak ada tantangan QQ yang aktif di grup ini!' }, { quoted: msg });
  }

  const challenge = global.db.qqChallenges[remoteJid];
  const senderId = getSenderId(msg, remoteJid);

  if (senderId !== challenge.challenged) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tantangan ini bukan untuk lu!' }, { quoted: msg });
  }

  delete global.db.qqChallenges[remoteJid];

  // Mulai game QQ multiplayer (3 Ronde)
  global.db.game[remoteJid] = {
    type: 'qq',
    players: [challenge.challenger, challenge.challenged],
    scores: { [challenge.challenger]: 0, [challenge.challenged]: 0 },
    round: 1,
    maxRound: 3,
    bet: challenge.bet,
    mode: 'pvp'
  };

  await sock.sendMessage(remoteJid, {
    text: `🃏 *DUEL QQ DIMULAI!*\n\n@${challenge.challenger.split('@')[0]} vs @${challenge.challenged.split('@')[0]}\nTaruhan: *${challenge.bet}* poin (3 Ronde).\n\nKetik *.qq* untuk mulai Ronde 1!`,
    mentions: [challenge.challenger, challenge.challenged]
  }, { quoted: msg });
}

async function qqRejectCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  if (!global.db?.qqChallenges?.[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tidak ada tantangan QQ yang aktif!' }, { quoted: msg });
  }

  const challenge = global.db.qqChallenges[remoteJid];
  const senderId = getSenderId(msg, remoteJid);

  if (senderId !== challenge.challenged && senderId !== challenge.challenger) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Lu bukan bagian dari tantangan ini!' }, { quoted: msg });
  }

  delete global.db.qqChallenges[remoteJid];
  await sock.sendMessage(remoteJid, { text: `❌ Tantangan QQ dibatalkan/ditolak.` }, { quoted: msg });
}

module.exports = { qqAcceptCommand, qqRejectCommand };

