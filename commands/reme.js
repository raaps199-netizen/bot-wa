if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

// Helper untuk mencari data user di database secara akurat tanpa peduli format JID/LID/Device
function findUserStats(userId) {
  if (!global.db.users) global.db.users = {};
  
  // Ambil deretan angka murni nomor HP (minimal 5 digit terakhir untuk amannya)
  const cleanNum = userId.replace(/[^0-9]/g, '');
  const searchKey = cleanNum.slice(-10); // Ambil 10 digit nomor belakang

  let matchedKey = Object.keys(global.db.users).find(k => k.includes(searchKey));

  if (!matchedKey) {
    // Kalau benar-benar belum ada, buat baru pakai format standar senderId
    matchedKey = userId;
    global.db.users[matchedKey] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  return global.db.users[matchedKey];
}

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = msg.key.participant || remoteJid;
  const senderId = rawSenderId.split(':')[0] + '@s.whatsapp.net';

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro! (Atau ketik .batal)' }, { quoted: msg });
  }

  // 1. Ambil target mention atau reply dengan aman
  let targetId = null;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (mentioned.length > 0) {
    targetId = mentioned[0];
  } else if (quotedParticipant) {
    targetId = quotedParticipant;
  } else if (args.length > 0 && args[0].includes('@')) {
    const cleanNum = args[0].replace(/[^0-9]/g, '');
    if (cleanNum.length >= 5) targetId = cleanNum + '@s.whatsapp.net';
  }

  // 2. Ambil angka taruhan
  let betAmount = 15;
  const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
  if (numericArgs.length > 0) {
    betAmount = parseInt(numericArgs[0]);
    if (betAmount <= 0) betAmount = 15;
  }

  // Ambil data skor pengirim pakai helper yang aman dari beda format ID
  const senderStats = findUserStats(senderId);
  const senderScore = (senderStats.triviaScore || 0) + (senderStats.mathScore || 0) + (senderStats.score || 0);

  // --- KONDISI A: MAIN SENDIRI (LAWAN BOT) ---
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

  // --- KONDISI B: PVP (LAWAN MANUSIA) ---
  if (targetId === senderId || targetId.includes(senderId.split('@')[0])) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  // Ambil data skor target pakai helper yang sama
  const targetStats = findUserStats(targetId);
  const targetScore = (targetStats.triviaScore || 0) + (targetStats.mathScore || 0) + (targetStats.score || 0);

  if (senderScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang, bre! Poin lo saat ini: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
  }

  if (targetScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu total poinnya gak cukup buat taruhan *${betAmount}* poin! (Poin target: ${targetScore})` }, { quoted: msg });
  }

  // Simpan tantangan PvP
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
