// File: commands/tf.js
const { getUserData, addPoints, deductPoints } = require('../utils/helper');
const { getSenderId, resolveUserKey } = require('../utils/jid-utils');

module.exports = async function tfCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  try {
    const rawSenderId = getSenderId(msg, remoteJid) || (msg.key.participant || remoteJid);
    const senderId = resolveUserKey(global.db, rawSenderId);

    // 1. Ambil target
    let targetId = null;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned.length > 0) {
      targetId = resolveUserKey(global.db, mentioned[0]);
    } else if (quotedParticipant) {
      targetId = resolveUserKey(global.db, quotedParticipant);
    } else {
      const argTarget = args.find(arg => arg.includes('@') || (!isNaN(arg) && arg.length >= 10));
      if (argTarget) {
        const cleanNum = argTarget.replace(/[^0-9]/g, '');
        targetId = resolveUserKey(global.db, cleanNum + '@s.whatsapp.net');
      }
    }

    if (!targetId || targetId === senderId) {
      return await sock.sendMessage(remoteJid, {
        text: `⚠️ Format salah atau mau transfer ke diri sendiri?\nCara pakai: *.tf @tag nominal*`
      }, { quoted: msg });
    }

    // 2. Ambil Nominal
    const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
    if (numericArgs.length === 0) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Masukin nominal angkanya bre!` }, { quoted: msg });
    }

    const tfAmount = parseInt(numericArgs[0]);
    if (tfAmount <= 0) return await sock.sendMessage(remoteJid, { text: `⚠️ Nominal gak boleh 0 atau minus!` }, { quoted: msg });

    // 3. Cek saldo — pake `score` (dompet tunggal), BUKAN mathScore+triviaScore.
    const sender = getUserData(remoteJid, senderId);
    const senderTotal = sender.score || 0;

    if (senderTotal < tfAmount) {
      return await sock.sendMessage(remoteJid, {
        text: `⚠️ Poin lu gak cukup! Total poin lu cuma *${senderTotal}*, tapi mau tf *${tfAmount}*.`
      }, { quoted: msg });
    }

    // 4. Pindahin poin lewat helper yang sama dipake .reme/.qq
    deductPoints(remoteJid, senderId, tfAmount);
    addPoints(remoteJid, targetId, 'trivia', tfAmount);

    const sisaPoin = getUserData(remoteJid, senderId).score || 0;

    await sock.sendMessage(remoteJid, {
      text: `💸 *Transfer Berhasil!*\n\n@${senderId.split('@')[0]} tf *${tfAmount} Poin* ke @${targetId.split('@')[0]}.\nSisa poin lu: *${sisaPoin}*`,
      mentions: [senderId, targetId]
    }, { quoted: msg });

  } catch (err) {
    // DEBUG: sebelumnya error di sini ke-telen diem-diem sama try/catch di
    // handleMessage.js (cuma nongol di console log server, gak pernah nyampe
    // ke WhatsApp). Sekarang errornya dikirim balik ke chat biar langsung
    // ketauan apa yang salah tanpa perlu buka log Railway.
    console.error('Error di tfCommand:', err);
    await sock.sendMessage(remoteJid, {
      text: `❌ [DEBUG] Error di .tf: ${err.message}`
    }, { quoted: msg });
  }
};
