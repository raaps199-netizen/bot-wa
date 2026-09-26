// File: commands/score.js
const { getUserData, getTotalScore, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  const user = getUserData(global.db, senderId);
  const totalScore = getTotalScore(user);
  const pushName = msg.pushName || 'User';

  const text = `📊 *STATUS SALDO & STATISTIK* 📊\n\n` +
    `👤 Nama: *${user.nickname || pushName}*\n` +
    `💰 Total Saldo: *${formatRupiah(totalScore)}*\n` +
    `_Saldo utama bot terpusat di Total Saldo!_`;

  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

module.exports = scoreCommand;
