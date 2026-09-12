if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

// Fungsi helper buat ambil total skor tanpa peduli beda format JID / device
function getUserTotalScore(userId) {
  if (!global.db.users) return 0;
  
  // Cari berdasarkan key persis atau nomor bersihnya
  const cleanTarget = userId.split(':')[0].split('@')[0];
  let foundUserKey = Object.keys(global.db.users).find(k => k.includes(cleanTarget));
  
  if (!foundUserKey || !global.db.users[foundUserKey]) {
    return 0;
  }

  const stats = global.db.users[foundUserKey];
  return (stats.triviaScore || 0) + (stats.mathScore || 0) + (stats.score || 0);
}

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = msg.key.participant || remoteJid;
  const senderId = rawSenderId.split(':')[0] + '@s.whatsapp.net';

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro! (Atau ketik .batal)' }, { quoted: msg });
  }

  // Ambil target dengan pembersihan device id string yang akurat
  let targetId = null;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (mentioned.length > 0) {
    targetId = mentioned[0].split(':')[0] + '@s.whatsapp.net';
  } else if (quotedParticipant) {
    targetId = quotedParticipant.split(':')[0] + '@s.whatsapp.net';
  } else if (args.length > 0 && args[0].includes('@')) {
    const cleanNum = args[0].replace(/[^0-9]/g, '');
    if (cleanNum.length >= 5) targetId = cleanNum + '@s.whatsapp.net';
  }

  // Ambil angka taruhan dari argumen (cari argumen yang berupa angka murni)
  let betAmount = 15;
  const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
  if (numericArgs.length > 0) {
    betAmount = parseInt(numericArgs[0]);
    if (betAmount <= 0) betAmount = 15;
  }

  const senderScore = getUserTotalScore(senderId);

  // --- 1. MAIN SENDIRI (LAWAN BOT) ---
  if (!targetId) {
    if (senderScore < betAmount) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Poin total lu kurang, bre! Poin lu saat ini: *${senderScore}*, tapi mau taruhan *${betAmount}*.` }, { quoted: msg });
    }

    const botJid = sock.user.id;
    const cleanBotId = botJid.includes(':') ? botJid.split(':')[0] + '@s.whatsapp.net' : botJid;

    global.db.game[remoteJid] = {
      type: 'reme',
      players: [senderId, cleanBotId],
      scores: { [senderId]: 0, [cleanBotId]: 0 },
      currentTurnIndex: 0,
      round: 1,
      maxRound: 3,
      roundData: {},
      bet: betAmount,
      mode: 'bot'
    };

    const senderName = senderId.split('@')[0];
    return await sock.sendMessage(remoteJid, {
      text: `🤖 *Wuih, nantangin bot buat Remenan mandiri!*\n\nTaruhan: *${betAmount}* poin (3 Ronde).\nSilakan @${senderName} ketik *.spin* buat mulai ronde 1!`,
      mentions: [senderId]
    }, { quoted: msg });
  }

  // --- 2. LAWAN MANUSIA (PVP) ---
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  const targetScore = getUserTotalScore(targetId);

  if (senderScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang, bre! Poin lo saat ini: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
  }

  if (targetScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu total poinnya gak cukup buat taruhan *${betAmount}* poin! (Poin target: ${targetScore})` }, { quoted: msg });
  }

  // Simpan data challenge dengan format JID bersih
  global.db.remeChallenges[remoteJid] = {
    challenger: senderId,
    challenged: targetId,
    bet: betAmount,
    timestamp: Date.now()
  };

  const text = `🎰 *REME DUEL TARUHAN POIN* 🎰\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} taruhan sebesar *${betAmount}* poin!\n\nKetik *.terima* buat gas main, atau *.tolak* buat kabur.`;

  await sock.sendMessage(remoteJid, {
    text: text,
    mentions: [senderId, targetId]
  }, { quoted: msg });
}

module.exports = remeCommand;
