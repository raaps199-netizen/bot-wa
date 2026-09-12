if (!global.db) global.db = {};
if (!global.db.remeChallenges) global.db.remeChallenges = {};
if (!global.db.game) global.db.game = {};
if (!global.db.users) global.db.users = {};

async function remeCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  
  try {
    const rawSenderId = msg.key.participant || remoteJid;
    const senderId = rawSenderId.includes('@g.us') ? remoteJid : rawSenderId;

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

    // 2. Ambil angka taruhan dari argumen
    let betAmount = 15;
    const numericArgs = args.filter(arg => !arg.includes('@') && !isNaN(arg));
    if (numericArgs.length > 0) {
      betAmount = parseInt(numericArgs[0]);
      if (betAmount <= 0) betAmount = 15;
    }

    // Helper pencari skor yang anti salah daftar ke ID Grup
    const getScore = (userJid, fallbackId) => {
      if (!global.db.users) global.db.users = {};
      
      const rawDigits = userJid.replace(/[^0-9]/g, '');
      const userPhoneSuffix = rawDigits.slice(-6);

      const foundKey = Object.keys(global.db.users).find(k => {
        const keyDigits = k.replace(/[^0-9]/g, '');
        return keyDigits.endsWith(userPhoneSuffix) || userPhoneSuffix.endsWith(keyDigits);
      });
      
      if (!foundKey) {
        const newKey = fallbackId.includes('@g.us') ? userJid : fallbackId;
        global.db.users[newKey] = { mathScore: 0, triviaScore: 0, score: 0 };
        return 0;
      }
      
      const stats = global.db.users[foundKey];
      return (stats.triviaScore || 0) + (stats.mathScore || 0) + (stats.score || 0);
    };

    const senderScore = getScore(senderId, senderId);

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

    const targetScore = getScore(targetId, targetId);

    if (senderScore < betAmount) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang, bre! Poin lu saat ini: *${senderScore}*, tapi taruhannya *${betAmount}*.` }, { quoted: msg });
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

  } catch (err) {
    console.error('ERROR DI REME COMMAND:', err);
    await sock.sendMessage(remoteJid, { text: `❌ Error internal game Reme: ${err.message}` }, { quoted: msg });
  }
}

module.exports = remeCommand;
          
