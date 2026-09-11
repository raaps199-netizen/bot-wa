if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro!' }, { quoted: msg });
  }

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tag player yang mau ditantang!\nContoh: *.reme @user 50*' }, { quoted: msg });
  }

  const targetId = mentioned[0];
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  let betAmount = 15;
  const potentialBet = args.find(arg => !arg.includes('@') && !isNaN(arg));
  if (potentialBet) {
    betAmount = parseInt(potentialBet);
    if (betAmount <= 0) betAmount = 15;
  }

  // Deteksi bot yang lebih akurat agar tidak minta taruhan poin
  const botJid = sock.user.id;
  const cleanBotId = botJid.includes(':') ? botJid.split(':')[0] + '@s.whatsapp.net' : botJid;
  const isTargetBot = (targetId === cleanBotId || targetId.includes(sock.user.id.split(':')[0]) || targetId.includes('bot'));

  if (!global.db.users[senderId]) {
    global.db.users[senderId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  // 1. KHUSUS LAWAN BOT: Langsung gas tanpa cek poin & taruhan 0 (gratis)
  if (isTargetBot) {
    global.db.game[remoteJid] = {
      type: 'reme',
      players: [senderId, cleanBotId],
      scores: { [senderId]: 0, [cleanBotId]: 0 },
      currentTurnIndex: 0,
      round: 1,
      maxRound: 3,
      roundData: {},
      bet: 0
    };

    const senderName = senderId.split('@')[0];
    await sock.sendMessage(remoteJid, {
      text: `🤖 *Wuih, nantangin bot buat Remenan santai!*\n\nPermainan 3 Ronde dimulai tanpa taruhan.\nSilakan @${senderName} ketik *.spin* buat ronde 1!`,
      mentions: [senderId]
    }, { quoted: msg });
    return;
  }

  // 2. LAWAN MANUSIA: Cek total akumulasi poin dari semua game
  if (!global.db.users[targetId]) {
    global.db.users[targetId] = { mathScore: 0, triviaScore: 0, score: 0 };
  }

  const senderStats = global.db.users[senderId];
  const senderScore = (senderStats.triviaScore || 0) + (senderStats.mathScore || 0) + (senderStats.score || 0);

  const targetStats = global.db.users[targetId];
  const targetScore = (targetStats.triviaScore || 0) + (targetStats.mathScore || 0) + (targetStats.score || 0);

  if (senderScore < betAmount) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang, bre! Poin lo saat ini: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
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
