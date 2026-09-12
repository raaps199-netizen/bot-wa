// File: commands/qq.js
const { getUserData, addPoints, deductPoints, parseBetAmount } = require('../utils/helper');
const { isPersonalJid, getSenderId } = require('../utils/jid-utils');

function ensureDB() {
  if (!global.db) global.db = {};
  if (!global.db.qqChallenges) global.db.qqChallenges = {};
  if (!global.db.game) global.db.game = {};
}
ensureDB();

// Fungsi untuk menghitung hasil QQ berdasarkan aturan angka belakang / nilai khusus
function getQqResult() {
  const roll = Math.floor(Math.random() * 35) + 1; // Nilai 1 s.d 35
  const autoWins = [10, 20, 30];
  const autoLoses = [1, 11, 21, 31];

  let power = roll % 10; // Angka belakang / modulo 10
  let status = 'normal';

  if (autoWins.includes(roll)) {
    power = 999; // Kekuatan tertinggi (Auto Win)
    status = 'autowin';
  } else if (autoLoses.includes(roll)) {
    power = -999; // Kekuatan terendah (Auto Lose)
    status = 'autolose';
  }

  return { roll, power, status };
}

async function qqCommand(sock, msg, args) {
  ensureDB();
  const remoteJid = msg.key.remoteJid;

  try {
    const senderId = getSenderId(msg, remoteJid);
    if (!senderId) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Gagal mendeteksi akun personal lu! Coba ketik command sambil *reply* pesan lu sendiri.' }, { quoted: msg });
    }

    // Cek apakah ada game aktif di chat ini
    if (global.db.game[remoteJid]) {
      const currentGame = global.db.game[remoteJid];
      if (currentGame.type === 'qq') {
        // Jika game QQ sedang aktif, ketik .qq lagi berfungsi untuk lanjut ronde (spin/roll)
        return handleQqTurn(sock, msg, remoteJid, senderId, currentGame);
      } else {
        return await sock.sendMessage(remoteJid, { text: '⚠️ Chat ini sedang ada game lain yang aktif, selesaikan dulu bro!' }, { quoted: msg });
      }
    }

    const senderUser = getUserData(remoteJid, senderId);
    const senderScore = senderUser.score || ((senderUser.mathScore || 0) + (senderUser.triviaScore || 0));

    if (senderScore <= 0) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Poin lu 0 di grup ini, gak bisa main QQ!' }, { quoted: msg });
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
      return await sock.sendMessage(remoteJid, { text: `⚠️ Poin lo kurang! Poin saat ini: *${senderScore}*, mau taruhan *${betAmount}*.` }, { quoted: msg });
    }

    // Jika tidak tag siapa pun -> Lawan Bot (3 Ronde)
    if (!targetId) {
      const botJid = sock.user.id;
      const cleanBotId = botJid.includes(':') ? botJid.split(':')[0] + '@s.whatsapp.net' : botJid;

      global.db.game[remoteJid] = {
        type: 'qq',
        players: [senderId, cleanBotId],
        scores: { [senderId]: 0, [cleanBotId]: 0 },
        round: 1,
        maxRound: 3,
        bet: betAmount,
        mode: 'bot'
      };

      return await sock.sendMessage(remoteJid, {
        text: `🃏 *QQ DUEL VS BOT (3 RONDE)* 🃏\n\nTaruhan: *${betAmount}* poin.\nKetik *.qq* lagi untuk mulai Ronde 1!`,
        mentions: [senderId]
      }, { quoted: msg });
    }

    if (targetId === senderId || targetId.includes(senderId.split('@')[0])) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Mau main lawan diri sendiri wkwk?' }, { quoted: msg });
    }

    const targetUser = getUserData(remoteJid, targetId);
    const targetScore = targetUser.score || ((targetUser.mathScore || 0) + (targetUser.triviaScore || 0));

    if (targetScore < betAmount) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Poin lawan tidak cukup untuk taruhan *${betAmount}* poin! (Poin target: ${targetScore})` }, { quoted: msg });
    }

    global.db.qqChallenges[remoteJid] = {
      challenger: senderId,
      challenged: targetId,
      bet: betAmount,
      timestamp: Date.now()
    };

    const text = `🃏 *QQ DUEL TARUHAN POIN* 🃏\n\n@${senderId.split('@')[0]} menantang @${targetId.split('@')[0]} taruhan QQ sebesar *${betAmount}* poin!\n\nKetik *.terimaqq* untuk gas main, atau *.tolakqq* untuk batal.`;

    await sock.sendMessage(remoteJid, { text, mentions: [senderId, targetId] }, { quoted: msg });

  } catch (err) {
    console.error('ERROR DI QQ COMMAND:', err);
    await sock.sendMessage(remoteJid, { text: `❌ Error internal QQ: ${err.message}` }, { quoted: msg });
  }
}

// Handler untuk melanjutkan putaran/ronde game QQ
async function handleQqTurn(sock, msg, remoteJid, senderId, game) {
  if (!game.players.includes(senderId)) {
    return await sock.sendMessage(remoteJid, { text: '⚠️ Lu bukan peserta game QQ yang sedang aktif di chat ini!' }, { quoted: msg });
  }

  const p1 = game.players[0];
  const p2 = game.players[1];

  // Roll untuk kedua pemain di ronde ini
  const res1 = GetQqDetails(p1, game); // helper lokal
  const res2 = GetQqDetails(p2, game);

  const r1 = getQqResult();
  const r2 = getQqResult();

  let roundWinner = '';
  if (r1.power > r2.power) {
    roundWinner = p1;
    game.scores[p1] = (game.scores[p1] || 0) + 1;
  } else if (r2.power > r1.power) {
    roundWinner = p2;
    game.scores[p2] = (game.scores[p2] || 0) + 1;
  } else {
    roundWinner = 'Seri';
  }

  let text = `🃏 *QQ DUEL - RONDE ${game.round}/${game.maxRound}* 🃏\n\n`;
  text += `👤 @${p1.split('@')[0]}: Total *${r1.roll}* (Angka belakang: ${r1.roll % 10})${r1.status === 'autowin' ? ' 🔥 [AUTO WIN]' : r1.status === 'autolose' ? ' 💀 [AUTO LOSE]' : ''}\n`;
  text += `👤 @${p2.split('@')[0]}: Total *${r2.roll}* (Angka belakang: ${r2.roll % 10})${r2.status === 'autowin' ? ' 🔥 [AUTO WIN]' : r2.status === 'autolose' ? ' 💀 [AUTO LOSE]' : ''}\n\n`;
  
  if (roundWinner === 'Seri') {
    text += `⚖️ Ronde ${game.round} *SERI*!`;
  } else {
    text += `🏆 Pemenang Ronde ${game.round}: @${roundWinner.split('@')[0]}!`;
  }

  if (game.round >= game.maxRound) {
    // Game Selesai
    const scoreP1 = game.scores[p1] || 0;
    const scoreP2 = game.scores[p2] || 0;

    text += `\n\n🏁 *PERMAINAN SELESAI!*\nSkor Akhir:\n@${p1.split('@')[0]} (${scoreP1}) vs @${p2.split('@')[0]} (${scoreP2})\n\n`;

    let finalWinner = null;
    if (scoreP1 > scoreP2) finalWinner = p1;
    else if (scoreP2 > scoreP1) finalWinner = p2;

    const bet = game.bet;
    if (finalWinner) {
      const loser = finalWinner === p1 ? p2 : p1;
      // Cek apakah loser adalah bot
      if (!loser.includes('@s.whatsapp.net') || loser === sock.user.id || loser.includes('bot')) {
        addPoints(remoteJid, finalWinner, 'trivia', bet);
      } else {
        deductPoints(remoteJid, loser, bet);
        addPoints(remoteJid, finalWinner, 'trivia', bet);
      }
      text += `🎉 Pemenang Utama: @${finalWinner.split('@')[0]} memenangkan *+${bet}* poin!`;
    } else {
      text += `⚖️ Pertandingan Berakhir SERI! Tidak ada poin yang ditukar.`;
    }

    delete global.db.game[remoteJid];
  } else {
    game.round += 1;
    text += `\n\nKetik *.qq* lagi untuk lanjut ke Ronde ${game.round}!`;
  }

  await sock.sendMessage(remoteJid, { text, mentions: [p1, p2] }, { quoted: msg });
}

function GetQqDetails(userId, game) {
  return {};
}

module.exports = qqCommand;
    
