// File: commands/reme.js
const { getUserData, parseBetAmount } = require('../utils/helper');
const { isPersonalJid, getSenderId } = require('../utils/jid-utils');

function ensureDB() {
  if (!global.db) global.db = {};
  if (!global.db.remeChallenges) global.db.remeChallenges = {};
  if (!global.db.game) global.db.game = {};
}
ensureDB();

async function remeCommand(sock, msg, args) {
  ensureDB();
  const remoteJid = msg.key.remoteJid;

  try {
    const senderId = getSenderId(msg, remoteJid);

    if (!senderId) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Gagal mendeteksi akun personal lu! Coba ketik command sambil *reply* salah satu pesan lu sendiri.' }, { quoted: msg });
    }

    if (global.db.game[remoteJid]) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro! (Atau ketik .batal)' }, { quoted: msg });
    }

    const senderUser = getUserData(remoteJid, senderId);
    const senderScore = senderUser.score || ((senderUser.mathScore || 0) + (senderUser.triviaScore || 0));

    if (senderScore <= 0) {
      const globalKeys = Object.keys(global.db.users || {});
      const groupDataKeys = Object.keys(global.db.groups?.[remoteJid]?.users || {});
      const debugMsg = `⚠️ [DEBUG ERROR]\n` +
        `- remoteJid: ${remoteJid}\n` +
        `- senderId terdeteksi: ${senderId}\n` +
        `- senderUser object: ${JSON.stringify(senderUser)}\n` +
        `- Total key di global.db.users: ${globalKeys.length}\n` +
        `- Contoh key global: ${globalKeys.slice(0, 3).join(', ')}\n` +
        `- Key grup saat ini: ${groupDataKeys.join(', ')}`;
      
      return await sock.sendMessage(remoteJid, { text: debugMsg }, { quoted: msg });
    }

    let targetId = null;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned.length > 0 && isPersonalJid(mentioned[0])) {
      targetId = mentioned[0];
    } else if (isPersonalJid(quotedParticipant)) {
      targetId = quotedParticipant;
    } else {
      const argTarget = args.find(arg => arg.includes('@') || (!isNaN(arg) && arg.length > 5));
      if (argTarget) {
        const cleanNum = argTarget.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 5) {
          const candidate = cleanNum + '@s.whatsapp.net';
          if (isPersonalJid(candidate)) targetId = candidate;
        }
      }
    }

    let betAmount = parseBetAmount(args, senderScore);
    if (!betAmount || betAmount <= 0) {
      betAmount = 15;
    }

    if (senderScore < betAmount) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Total poin lo kurang di grup ini! Poin lu saat ini: *${senderScore}*, tapi mau taruhan *${betAmount}*.` }, { quoted: msg });
    }

    if (!targetId) {
      const botJid = sock.user.id;
      const cleanBotId = botJid.includes(':') ? botJid.split(':')[0] + '@s.whatsapp.net' : botJid;

      ensureDB();
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

    if (targetId === senderId || targetId.includes(senderId.split('@')[0])) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
    }

    const targetUser = getUserData(remoteJid, targetId);
    const targetScore = targetUser.score || ((targetUser.mathScore || 0) + (targetUser.triviaScore || 0));

    if (targetScore < betAmount) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Lawan lu total poinnya gak cukup buat taruhan *${betAmount}* poin di grup ini! (Poin target: ${targetScore})` }, { quoted: msg });
    }

    ensureDB();
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
