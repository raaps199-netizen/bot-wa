// File: commands/qq.js
const { getUserData, getTotalScore } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

async function qqCommand(sock, msg, args) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = getSenderId(msg, remoteJid) || msg.key.participant || remoteJid;

    const senderUser = getUserData(global.db, senderId);
    let userScore = getTotalScore(senderUser);

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    let taruhan = 0;
    for (let arg of args) {
      let parsed = parseInt(arg);
      if (!isNaN(parsed) && !arg.includes('@')) {
        taruhan = parsed;
      }
    }
    
    if (args.includes('all') || args.includes('semua')) {
      taruhan = userScore;
    }

    if (isNaN(taruhan) || taruhan <= 0) {
      await sock.sendMessage(remoteJid, { 
        text: `❌ Jumlah taruhan tidak valid!\nContoh: *.qq 30* atau *.qq @user 30*` 
      }, { quoted: msg });
      return;
    }

    if (userScore < taruhan) {
      await sock.sendMessage(remoteJid, { text: `❌ Poin kamu tidak cukup! Poin kamu saat herat: *${userScore}*` }, { quoted: msg });
      return;
    }

    if (global.db.game && global.db.game[remoteJid]) {
      await sock.sendMessage(remoteJid, { text: `⚠️ Masih ada sesi game yang sedang aktif di chat ini!` }, { quoted: msg });
      return;
    }

    if (!global.db.game) global.db.game = {};

    // Mode Lawan Bot
    if (mentioned.length === 0) {
      senderUser.score -= taruhan;
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      global.db.game[remoteJid] = {
        type: 'qq',
        mode: 'bot',
        player: senderId,
        taruhan: taruhan,
        round: 1,
        scores: {
          [senderId]: { wins: 0, currentRoll: 0, currentReme: 0 }
        },
        botScore: { wins: 0, currentRoll: 0, currentReme: 0 },
        turn: senderId,
        status: 'playing'
      };

      const senderName = senderId.split('@')[0];
      await sock.sendMessage(remoteJid, {
        text: `🎰 *QQ DUEL LAWAN BOT (3 RONDE)* 🎰\n\n@${senderName} memulai taruhan sebesar *${taruhan}* poin melawan Bot!\n\nPermainan QQ 3 Ronde dimulai!\nGiliran pertama melakukan *.spinqq* adalah: @${senderName}`,
        mentions: [senderId]
      }, { quoted: msg });

    } else {
      // Mode PvP
      const targetId = mentioned[0];
      if (targetId === senderId) {
        await sock.sendMessage(remoteJid, { text: `❌ Mana bisa mabar/duel lawan diri sendiri, wkwk!` }, { quoted: msg });
        return;
      }

      const targetUser = getUserData(global.db, targetId);
      const targetScore = getTotalScore(targetUser);

      if (targetScore < taruhan) {
        await sock.sendMessage(remoteJid, { text: `❌ Poin @${targetId.split('@')[0]} tidak cukup untuk menandingi taruhan ini! (Poin: ${targetScore})` }, { quoted: msg });
        return;
      }

      global.db.game[remoteJid] = {
        type: 'qq',
        mode: 'pvp',
        p1: senderId,
        p2: targetId,
        taruhan: taruhan,
        status: 'pending'
      };

      const senderName = senderId.split('@')[0];
      const targetName = targetId.split('@')[0];

      await sock.sendMessage(remoteJid, {
        text: `🎰 *QQ DUEL TARUHAN POIN* 🎰\n\n@${senderName} menantang @${targetName} taruhan sebesar *${taruhan}* poin!\n\nKetik *.terimaqq* buat gas main, atau *.tolakqq* buat kabur.`,
        mentions: [senderId, targetId]
      }, { quoted: msg });
    }

  } catch (err) {
    console.error('Error di qqCommand:', err);
  }
}

module.exports = qqCommand;
