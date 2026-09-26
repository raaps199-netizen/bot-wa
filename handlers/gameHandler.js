// File: handlers/gameHandler.js
const { getUserData, addPoints } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function handleGameAnswer(sock, msg, customText = null) {
  try {
    const remoteJid = msg.key.remoteJid;
    const game = global.db?.game?.[remoteJid];
    if (!game) return false;

    const innerMsg = msg.message?.ephemeralMessage?.message ||
      msg.message?.viewOnceMessage?.message ||
      msg.message?.viewOnceMessageV2?.message ||
      msg.message?.documentWithCaptionMessage?.message ||
      msg.message;

    const body = innerMsg?.conversation ||
      innerMsg?.extendedTextMessage?.text ||
      innerMsg?.imageMessage?.caption ||
      innerMsg?.videoMessage?.caption || '';

    const cleanBody = customText
      ? String(customText).trim().toLowerCase()
      : String(body).trim().toLowerCase();
    if (!cleanBody) return false;

    const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

    if (cleanBody === '.nyerah' || cleanBody === 'nyerah') {
      if (game.type === 'reme') {
        if (game.timer) clearTimeout(game.timer);
        const answerText = String(game.jawaban || game.jawabanBenar || '').toUpperCase();
        delete global.db.game[remoteJid];
        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        await sock.sendMessage(remoteJid, {
          text: `🏳️ *Menyerah!* Game REME dihentikan.\nJawaban yang benar adalah: *${answerText}*`
        }, { quoted: msg });
        return true;
      }
    }

    if (game.type === 'reme') {
      const targetAnswer = String(game.jawaban || game.jawabanBenar || '').toLowerCase();
      if (cleanBody === targetAnswer) {
        if (game.timer) clearTimeout(game.timer);
        delete global.db.game[remoteJid];
        const reward = game.poin || game.points || game.reward || 15;
        addPoints(global.db, senderId, reward);
        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        const senderName = senderId.split('@')[0];
        await sock.sendMessage(remoteJid, {
          text: `🎉 *SELAMAT @${senderName}!* Jawaban kamu benar.\n💰 Poin Bertambah: *+${reward} Poin*`,
          mentions: [senderId]
        }, { quoted: msg });
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error di handleGameAnswer:', err);
    return false;
  }
}

module.exports = handleGameAnswer;
