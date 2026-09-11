if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro!' }, { quoted: msg });
  }

  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentioned.length === 0) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Tag player atau bot yang mau ditantang!\nContoh: *.reme @bot*' }, { quoted: msg });
  }

  const targetId = mentioned[0];
  if (targetId === senderId) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
  }

  // Cek apakah yang ditag itu nomormu sendiri (nomor bot)
  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isTargetBot = targetId.includes(sock.user.id.split(':')[0]);

  if (isTargetBot) {
    // Kalau ditantang, bot langsung auto-terima dan mulai game 3 ronde!
    global.db.game[remoteJid] = {
      type: 'reme',
      players: [senderId, botNumber],
      scores: {
        [senderId]: 0,
        [botNumber]: 0
      },
      currentTurnIndex: 0, // Giliran player duluan
      round: 1,
      maxRound: 3,
      roundData: {}
    };

    const senderName = senderId.split('@')[0];
    await sock.sendMessage(remoteJid, {
      text: `🤖 *Wuih, nantangin bot ya? Berani juga lu!*\n\nTantangan diterima otomatis! Permainan Reme 3 Ronde lawan Bot dimulai.\n\nSilakan @${senderName} ketik *.spin* buat ronde 1!`,
      mentions: [senderId]
    }, { quoted: msg });
    return;
  }

  // Kalau yang ditantang player lain (manusia)
  global.db.remeChallenges[remoteJid] = {
    challenger: senderId,
    challenged: targetId,
    timestamp: Date.now()
  };

  const text = `🎰 *REMEY DUEL CHALLENGE* 🎰\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} buat adu Reme Kasino!\n\nKetik *.terima* buat gas main, atau *.tolak* buat kabur.`;

  await sock.sendMessage(remoteJid, {
    text: text,
    mentions: [senderId, targetId]
  }, { quoted: msg });
}

module.exports = remeCommand;
