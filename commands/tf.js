// File: commands/tf.js
module.exports = async function tfCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  // 1. Ambil target
  let targetId = null;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (mentioned.length > 0) {
    targetId = mentioned[0];
  } else if (quotedParticipant) {
    targetId = quotedParticipant;
  } else {
    const argTarget = args.find(arg => arg.includes('@') || (!isNaN(arg) && arg.length >= 10));
    if (argTarget) {
      const cleanNum = argTarget.replace(/[^0-9]/g, '');
      targetId = cleanNum + '@s.whatsapp.net';
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

  const sender = global.db.users[senderId] || { mathScore: 0, triviaScore: 0, score: 0 };
  const senderTotal = (sender.mathScore || 0) + (sender.triviaScore || 0);

  if (senderTotal < tfAmount) {
    return await sock.sendMessage(remoteJid, { 
      text: `⚠️ Poin lu gak cukup! Total poin lu cuma *${senderTotal}*, tapi mau tf *${tfAmount}*.` 
    }, { quoted: msg });
  }

  if (!global.db.users[targetId]) global.db.users[targetId] = { mathScore: 0, triviaScore: 0, score: 0 };
  const receiver = global.db.users[targetId];

  // 3. Logic Sedot Poin
  let remaining = tfAmount;
  if (sender.triviaScore && sender.triviaScore > 0) {
    const take = Math.min(sender.triviaScore, remaining);
    sender.triviaScore -= take;
    remaining -= take;
  }
  if (remaining > 0 && sender.mathScore && sender.mathScore > 0) {
    const take = Math.min(sender.mathScore, remaining);
    sender.mathScore -= take;
    remaining -= take;
  }

  // 4. Tambah Poin & Sinkronisasi
  receiver.triviaScore = (receiver.triviaScore || 0) + tfAmount;

  sender.score = (sender.mathScore || 0) + (sender.triviaScore || 0);
  receiver.score = (receiver.mathScore || 0) + (receiver.triviaScore || 0);

  if (typeof global.saveDatabase === 'function') global.saveDatabase();

  await sock.sendMessage(remoteJid, { 
    text: `💸 *Transfer Berhasil!*\n\n@${senderId.split('@')[0]} tf *${tfAmount} Poin* ke @${targetId.split('@')[0]}.\nSisa poin lu: *${sender.score}*`,
    mentions: [senderId, targetId]
  }, { quoted: msg });
};
