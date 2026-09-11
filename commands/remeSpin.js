async function spinCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  if (!global.db.game) global.db.game = {};

  const currentGame = global.db.game[remoteJid];

  if (!currentGame || currentGame.type !== 'reme') {
    return;
  }

  const emojis = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
  
  const getRandomSpin = () => [
    emojis[Math.floor(Math.random() * emojis.length)],
    emojis[Math.floor(Math.random() * emojis.length)],
    emojis[Math.floor(Math.random() * emojis.length)]
  ];

  const bet = currentGame.bet;

  // --- KONDISI 1: LAWAN BOT (Auto spin instan) ---
  if (currentGame.mode === 'bot') {
    if (currentGame.player !== senderId) return;

    const playerRoll = getRandomSpin();
    const botRoll = getRandomSpin();

    const getScoreValue = (roll) => {
      if (roll[0] === roll[1] && roll[1] === roll[2]) return 50;
      if (roll[0] === roll[1] || roll[1] === roll[2] || roll[0] === roll[2]) return 20;
      return 5;
    };

    const playerScoreVal = getScoreValue(playerRoll);
    const botScoreVal = getScoreValue(botRoll);

    const playerDb = global.db.users[currentGame.player];
    let resultText = `🎰 *HASIL SPIN REME VS BOT* 🎰\n\n`;
    resultText += `👤 @${currentGame.player.split('@')[0]}\n[ ${playerRoll.join(' | ')} ]\n\n`;
    resultText += `🤖 *Bot Kasino*\n[ ${botRoll.join(' | ')} ]\n\n`;

    if (playerScoreVal > botScoreVal) {
      playerDb.triviaScore = (playerDb.triviaScore || 0) + bet;
      resultText += `🎉 Selamat! Lu menang dan dapet *+${bet}* poin!`;
    } else if (playerScoreVal < botScoreVal) {
      playerDb.triviaScore = Math.max(0, (playerDb.triviaScore || 0) - bet);
      resultText += `💀 Waduh, lu kalah dan kehilangan *-${bet}* poin!`;
    } else {
      resultText += `🤝 Seri! Poin lu aman tidak bertambah atau berkurang.`;
    }

    delete global.db.game[remoteJid];
    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    return await sock.sendMessage(remoteJid, { 
      text: resultText,
      mentions: [currentGame.player]
    }, { quoted: msg });
  }

  // --- KONDISI 2: LAWAN ORANG LAIN (PvP Bergिलiran) ---
  if (currentGame.mode === 'pvp') {
    if (currentGame.status !== 'playing') return;

    // Tentukan siapa yang berhak spin saat giliran
    const isChallenger = senderId === currentGame.challenger;
    const isTarget = senderId === currentGame.target;

    if (!isChallenger && !isTarget) return;

    // Cek apakah pemain mencoba spin di luar gilirannya
    if (currentGame.turn && currentGame.turn !== senderId) {
      return await sock.sendMessage(remoteJid, { text: `⚠️ Sabar, bre! Bukan giliran lu buat spin.` }, { quoted: msg });
    }

    const roll = getRandomSpin();
    const getScoreValue = (roll) => {
      if (roll[0] === roll[1] && roll[1] === roll[2]) return 50;
      if (roll[0] === roll[1] || roll[1] === roll[2] || roll[0] === roll[2]) return 20;
      return 5;
    };

    const scoreVal = getScoreValue(roll);

    if (isChallenger) {
      currentGame.challengerRoll = roll;
      currentGame.challengerScore = scoreVal;
      // Pindahkan giliran ke target
      currentGame.turn = currentGame.target;

      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: `🎰 @${currentGame.challenger.split('@')[0]} telah memutar!\nHasil: [ ${roll.join(' | ')} ]\n\nGiliran @${currentGame.target.split('@')[0]}! Silakan ketik *.spin*`,
        mentions: [currentGame.challenger, currentGame.target]
      }, { quoted: msg });
    }

    if (isTarget) {
      currentGame.targetRoll = roll;
      currentGame.targetScore = scoreVal;

      const challengerDb = global.db.users[currentGame.challenger];
      const targetDb = global.db.users[currentGame.target];

      let resultText = `🎰 *HASIL AKHIR REME PVP* 🎰\n\n`;
      resultText += `👤 @${currentGame.challenger.split('@')[0]}\n[ ${currentGame.challengerRoll.join(' | ')} ]\n\n`;
      resultText += `👤 @${currentGame.target.split('@')[0]}\n[ ${roll.join(' | ')} ]\n\n`;

      if (currentGame.challengerScore > currentGame.targetScore) {
        challengerDb.triviaScore = (challengerDb.triviaScore || 0) + bet;
        targetDb.triviaScore = Math.max(0, (targetDb.triviaScore || 0) - bet);
        resultText += `🏆 Pemenang: @${currentGame.challenger.split('@')[0]} dan berhak bawa pulang *+${bet}* poin!`;
      } else if (currentGame.challengerScore < currentGame.targetScore) {
        targetDb.triviaScore = (targetDb.triviaScore || 0) + bet;
        challengerDb.triviaScore = Math.max(0, (challengerDb.triviaScore || 0) - bet);
        resultText += `🏆 Pemenang: @${currentGame.target.split('@')[0]} dan berhak bawa pulang *+${bet}* poin!`;
      } else {
        resultText += `🤝 Hasil Seri! Poin tidak ada yang berubah.`;
      }

      delete global.db.game[remoteJid];
      if (typeof global.saveDatabase === 'function') global.saveDatabase();

      return await sock.sendMessage(remoteJid, {
        text: resultText,
        mentions: [currentGame.challenger, currentGame.target]
      }, { quoted: msg });
    }
  }
}

module.exports = spinCommand;
          
