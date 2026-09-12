if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro! (Atau ketik .batal)' }, { quoted: msg });
  }

  // 1. Deteksi target dari berbagai metode (Mention, Reply, atau Ketik Nomor/Teks)
  let targetId = null;
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

  if (mentioned.length > 0) {
    targetId = mentioned[0];
  } else if (quotedParticipant) {
    targetId = quotedParticipant;
  } else if (args.length > 0 && args[0].includes('@')) {
    // Antisipasi jika argumen pertama mengandung format nomor
    const cleanNum = args[0].replace(/[^0-9]/g, '');
    if (cleanNum.length >= 5) targetId = cleanNum + '@s.whatsapp.net';
  }

  // 2. Ambil angka taruhan dari argumen (cari argumen yang berupa angka murni)
  let betAmount = 15;
  const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
  if (numericArgs.length > 0) {
    betAmount = parseInt(numericArgs[0]);
    if (betAmount <= 0) betAmount = 15;
  }

  if (!global.db.users[senderId]) {
    global.db.users[senderId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  // --- KONDISI A: MAIN SENDIRI (TANPA TARGET) -> LAWAN BOT ---
  if (!targetId) {
    const senderStats = global.db.users[senderId];
    const senderScore = (senderStats.triviaScore || 0) + (senderStats.mathScore || 0) + (senderStats.score || 0);

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

  // --- KONDISI B: LAWAN MANUSIA (PVP) ---
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  if (!global.db.users[targetId]) {
    global.db.users[targetId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  const senderStats = global.db.users[senderId];
  const senderScore = (senderStats.triviaScore || 0) + (senderStats.mathScore || 0) + (senderStats.score || 0);

  const targetStats = global.db.users[targetId];
  const targetScore = (targetStats.triviaScore || 0) + (targetStats.mathScore || 0) + (targetStats.score || 0);

  if (senderScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang, bre! Poin lo saat este: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
  }

  if (targetScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu total poinnya gak cukup buat taruhan *${betAmount}* poin!` }, { quoted: msg });
  }

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
