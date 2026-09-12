async function qqCommand(sock, msg, args) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;

    if (!global.db.users[senderId]) {
      global.db.users[senderId] = { score: 0 };
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    // Perbaikan pemfilteran argumen & penambahan info debug
    let nonTagArgs = args;
    let betInput = '';

    if (mentioned.length > 0) {
      nonTagArgs = args.filter(arg => !arg.includes('@'));
      betInput = nonTagArgs[0] ? nonTagArgs[0].toLowerCase() : '';
    } else {
      betInput = args[0] ? args[0].toLowerCase() : '';
    }

    let userScore = global.db.users[senderId].score || 0;
    let taruhan = 0;

    if (betInput === 'all' || betInput === 'semua') {
      taruhan = userScore;
    } else {
      taruhan = parseInt(betInput);
    }

    // Error message dengan info debug lengkap untuk melacak kesalahan
    if (isNaN(taruhan) || taruhan <= 0) {
      await sock.sendMessage(remoteJid, { 
        text: `❌ *DEBUG ERROR QQ* ❌\n- args mentah: ${JSON.stringify(args)}\n- nonTagArgs: ${JSON.stringify(nonTagArgs)}\n- betInput terbaca: "${betInput}"\n\n⚠️ Jumlah taruhan tidak valid atau tidak ditemukan! Pastikan format benar.\nContoh: *.qq @user 100*` 
      }, { quoted: msg });
      return;
    }

    if (userScore < taruhan) {
      await sock.sendMessage(remoteJid, { text: `❌ Poin kamu tidak cukup! Poin kamu saat ini: *${userScore}*` }, { quoted: msg });
      return;
    }

    // Cek apakah ada game aktif di chat ini
    if (global.db.game && global.db.game[remoteJid]) {
      await sock.sendMessage(remoteJid, { text: `⚠️ Masih ada sesi game yang sedang aktif di chat ini!` }, { quoted: msg });
      return;
    }

    if (!global.db.game) global.db.game = {};

    // Mode Lawan Bot
    if (mentioned.length === 0) {
      global.db.users[senderId].score -= taruhan;
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

      if (!global.db.users[targetId]) {
        global.db.users[targetId] = { score: 0 };
      }

      const targetScore = global.db.users[targetId].score || 0;
      if (targetScore < taruhan) {
        await sock.sendMessage(remoteJid, { text: `❌ Poin @${targetId.split('@')[0]} tidak cukup untuk menandingi taruhan ini!` }, { quoted: msg });
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
    await sock.sendMessage(remoteJid, { text: `❌ Terjadi error fatal pada command qq: ${err.message}` }, { quoted: msg });
  }
}

module.exports = qqCommand;
