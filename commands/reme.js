// File: commands/reme.js
const { getUserData, getTotalScore, parseNumber, parseBetAmount, formatRupiah } = require('../utils/helper');
const { isPersonalJid, getSenderId } = require('../utils/jid-utils');

function ensureDB() {
  if (!global.db) global.db = {};
  if (!global.db.remeChallenges) global.db.remeChallenges = {};
  if (!global.db.game) global.db.game = {};
  if (!global.db.users) global.db.users = {};
}
ensureDB();

async function remeCommand(sock, msg, args) {
  ensureDB();
  const remoteJid = msg.key.remoteJid;

  try {
    const senderId = getSenderId(msg, remoteJid);

    if (!senderId) {
      return await sock.sendMessage(remoteJid, { 
        text: '⚠️ Gagal mendeteksi akun personal lu! Coba ketik command sambil *reply* salah satu pesan lu sendiri.' 
      }, { quoted: msg });
    }

    if (global.db.game[remoteJid]) {
      return await sock.sendMessage(remoteJid, { 
        text: '⚠️ Chat ini sedang ada game aktif, selesaikan dulu bro! (Atau ketik .batal)' 
      }, { quoted: msg });
    }

    const senderUser = getUserData(global.db, senderId);
    const senderScore = getTotalScore(senderUser);

    let targetId = null;
    let targetArgStr = null;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (mentioned.length > 0 && isPersonalJid(mentioned[0])) {
      targetId = mentioned[0];
    } else if (isPersonalJid(quotedParticipant)) {
      targetId = quotedParticipant;
    } else {
      const argTarget = args.find(arg => arg.includes('@') || (!isNaN(arg.replace(/[^0-9]/g, '')) && arg.replace(/[^0-9]/g, '').length >= 10));
      if (argTarget) {
        targetArgStr = argTarget;
        const cleanNum = argTarget.replace(/[^0-9]/g, '');
        if (cleanNum.length >= 5) {
          const candidate = cleanNum + '@s.whatsapp.net';
          if (isPersonalJid(candidate)) targetId = candidate;
        }
      }
    }

    const filteredArgs = args.filter(a => a !== targetArgStr && !a.includes('@'));
    
    let betAmount = 0;
    const rawBetArg = filteredArgs.find(a => {
      const lower = a.toLowerCase();
      return lower === 'all' || lower === 'max' || lower === 'semua' || /[0-9]+([kKjJtTmM])?/.test(lower);
    });

    if (rawBetArg) {
      // Gunakan parseNumber agar support format '50k', '50jt', 'all', dll
      betAmount = parseNumber(rawBetArg, senderScore);
    } else if (typeof parseBetAmount === 'function') {
      betAmount = parseBetAmount(filteredArgs, senderScore);
    }

    if (isNaN(betAmount) || !betAmount || betAmount <= 0) {
      betAmount = 15000; // default fallback taruhan jika tidak diisi
    }

    if (senderScore < betAmount) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ Saldo lu gak cukup buat taruhan!\nSaldo lu saat ini: *${formatRupiah(senderScore)}*, tapi mau taruhan *${formatRupiah(betAmount)}*.` 
      }, { quoted: msg });
    }

    // Mode SOLO (Lawan Bot)
    if (!targetId) {
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
        text: `🤖 *Wuih, nantangin bot buat Remenan mandiri!*\n\nTaruhan: *${formatRupiah(betAmount)}* (3 Ronde).\nSilakan @${senderName} ketik *.spin* buat mulai ronde 1!`,
        mentions: [senderId]
      }, { quoted: msg });
    }

    if (targetId === senderId || targetId.includes(senderId.split('@')[0])) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Gila ya, mau main lawan diri sendiri wkwk!' }, { quoted: msg });
    }

    const targetUser = getUserData(global.db, targetId);
    const targetScore = getTotalScore(targetUser);

    if (targetScore < betAmount) {
      return await sock.sendMessage(remoteJid, { 
        text: `⚠️ Lawan lu total saldonya gak cukup buat taruhan *${formatRupiah(betAmount)}*! (Saldo target: ${formatRupiah(targetScore)})` 
      }, { quoted: msg });
    }

    global.db.remeChallenges[remoteJid] = {
      challenger: senderId,
      challenged: targetId,
      bet: betAmount,
      timestamp: Date.now()
    };

    const text = `🎰 *REME DUEL TARUHAN SALDO* 🎰\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} taruhan sebesar *${formatRupiah(betAmount)}*!\n\nKetik *.terima* buat gas main, atau *.tolak* buat kabur.`;

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
