// File: commands/score.js
const { getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  const user = getUserData(global.db, senderId);
  const totalScore = getTotalScore(user);
  const mathCount = user.mathCount || 0;
  const triviaCount = user.triviaCount || 0;

  const pushName = msg.pushName || 'User';

  const text = `📊 *STATUS SKOR & STATISTIK* 📊\n\n` +
    `👤 Nama: *${user.nickname || pushName}*\n` +
    `💰 Total Poin: *${totalScore}*\n` +
    `🧮 Math Selesai: *${mathCount} soal*\n` +
    `🧠 Trivia Selesai: *${triviaCount} soal*\n\n` +
    `_Semua poin game & aktivitas terpusat di Total Poin!_`;

  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

module.exports = scoreCommand;
