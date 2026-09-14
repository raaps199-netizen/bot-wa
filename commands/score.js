// File: commands/score.js
const { getUserData, getTotalScore, formatRupiah } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function scoreCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

  const user = getUserData(global.db, senderId);
  const totalScore = getTotalScore(user);
  const mathCount = user.mathCount || 0;
  const triviaCount = user.triviaCount || 0;
  // Menarik data jumlah tangkapan ikan
  const mancingCount = user.totalFish || 0;

  const pushName = msg.pushName || 'User';

  const text = `📊 *STATUS SALDO & STATISTIK* 📊\n\n` +
    `👤 Nama: *${user.nickname || pushName}*\n` +
    `💰 Total Saldo: *${formatRupiah(totalScore)}*[span_0](start_span)[span_0](end_span)\n` +
    `🧮 Math Selesai: *${mathCount} soal*[span_1](start_span)[span_1](end_span)\n` +
    `🧠 Trivia Selesai: *${triviaCount} soal*[span_2](start_span)[span_2](end_span)\n` +
    `🎣 Ikan Ditangkap: *${mancingCount} ekor*[span_3](start_span)[span_3](end_span)\n\n` +
    `_Semua saldo game & aktivitas terpusat di Total Saldo!_`;

  await sock.sendMessage(remoteJid, { text }, { quoted: msg });
}

module.exports = scoreCommand;
