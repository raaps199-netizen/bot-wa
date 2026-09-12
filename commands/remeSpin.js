function hitungReme(angka) {
  if (angka === 0) return { finalNum: 0, isSpecial: 'win3x' };
  if (angka === 9) return { finalNum: -1, isSpecial: 'autolose' };

  let sum = String(angka).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  while (sum > 9) {
    sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }

  if (sum === 9) return { finalNum: -1, isSpecial: 'autolose' };
  if (sum === 0) return { finalNum: 0, isSpecial: 'win3x' };

  return { finalNum: sum, isSpecial: null };
}

async function processBotRoundEnd(sock, remoteJid, game, playerRoll, botRoll) {
  const [p1, p2] = game.players; 
  const d1 = hitungReme(playerRoll);
  const d2 = hitungReme(botRoll);

  let roundWinner = null;

  if (d1.isSpecial === 'autolose' && d2.isSpecial !== 'autolose') {
    roundWinner = p2;
  } else if (d2.isSpecial === 'autolose' && d1.isSpecial !== 'autolose') {
    roundWinner = p1;
  } else if (d1.isSpecial === 'win3x' && d2.isSpecial !== 'win3x') {
    roundWinner = p1;
  } else if (d2.isSpecial === 'win3x' && d1.isSpecial !== 'win3x') {
    roundWinner = p2;
  } else {
    if (d1.finalNum > d2.finalNum) roundWinner = p1;
    else if (d2.finalNum > d1.finalNum) roundWinner = p2;
    else roundWinner = 'tie';
  }

  let summaryText = `📊 *HASIL RONDE ${game.round}*\n\n`;
  summaryText += `• @${p1.split('@')[0]} : ${playerRoll} (Reme: ${d1.finalNum === -1 ? '9 (Auto Lose)' : (d1.finalNum === 0 ? '0 (Auto Win)' : d1.finalNum)})\n`;
  summaryText += `• @${p2.split('@')[0]} (Bot) : ${botRoll} (Reme: ${d2.finalNum === -1 ? '9 (Auto Lose)' : (d2.finalNum === 0 ? '0 (Auto Win)' : d2.finalNum)})\n\n`;

  if (roundWinner === 'tie') {
    summaryText += `⚖️ Ronde ${game.round} *SERI*! Poin tidak bertambah.`;
  } else {
    game.scores[roundWinner]++;
    summaryText += `🏆 Pemenang Ronde ini: @${roundWinner === p1 ? p1.split('@')[0] + ' (Lu)' : 'Bot'}!`;
  }

  await sock.sendMessage(remoteJid, { text: summaryText, mentions: [p1] });

  // Tentukan batas kemenangan (misal: siapa yang duluan menang 2 ronde, atau jika sudah mencapai maxRound)
  const scoreP1 = game.scores[p1];
  const scoreP2 = game.scores[p2];
  const winningTarget = Math.ceil(game.maxRound / 2);

  const isGameOver = scoreP1 >= winningTarget || scoreP2 >= winningTarget || game.round >= game.maxRound;

  if (isGameOver) {
    let finalMsg = `🏁 *PERMAINAN REME SELESAI!*\n\nSkor Akhir:\n• @${p1.split('@')[0]} : ${scoreP1} Win\n• Bot : ${scoreP2} Win\n\n`;

    if (!global.db.users[p1]) global.db.users[p1] = { mathScore: 0, triviaScore: 0, score: 0 };

    if (scoreP1 > scoreP2) {
      finalMsg += `👑 Pemenang Utama: @${p1.split('@')[0]}!`;
      if (game.bet > 0) {
        global.db.users[p1].triviaScore = (global.db.users[p1].triviaScore || 0) + game.bet;
        finalMsg += `\n💰 Menang lawan bot, dapet hadiah *+${game.bet} Poin*!`;
      }
    } else if (scoreP2 > scoreP1) {
      finalMsg += `👑 Pemenang Utama: *Bot Kasino*!`;
      if (game.bet > 0) {
        global.db.users[p1].triviaScore = Math.max(0, (global.db.users[p1].triviaScore || 0) - game.bet);
        finalMsg += `\n💀 Kalah lawan bot, kehilangan taruhan sebesar *- ${game.bet} Poin*!`;
      }
    } else {
      finalMsg += `🤝 Pertandingan berakhir *SERI*! Poin aman.`;
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();
    delete global.db.game[remoteJid];
    
    return await sock.sendMessage(remoteJid, { text: finalMsg, mentions: [p1] });
  }

  game.round++;
  await sock.sendMessage(remoteJid, {
    text: `▶️ Lanjut ke *Ronde ${game.round}*!\nSilakan @${p1.split('@')[0]} ketik *.spin* lagi.`,
    mentions: [p1]
  });
}

async function spinCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const rawSenderId = msg.key.participant || remoteJid;
  const senderNumber = rawSenderId.split('@')[0].split(':')[0]; 
  
  const game = global.db?.game?.[remoteJid];

  if (!game || game.type !== 'reme') return;

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isPlayingWithBot = game.players.includes(botNumber);

  if (isPlayingWithBot) {
    const targetPlayer = game.players.find(p => p !== botNumber);
    const targetNumber = targetPlayer.split('@')[0].split(':')[0];

    if (senderNumber !== targetNumber) return;

    const playerRaw = Math.floor(Math.random() * 37);
    const playerRes = hitungReme(playerRaw);

    await sock.sendMessage(remoteJid, {
      text: `🎰 @${senderNumber} melakukan SPIN!\n🎲 Angka Keluar: *${playerRaw}*\n➕ Hasil Reme: *${playerRes.isSpecial === 'autolose' ? '9 (Auto Lose)' : (playerRes.isSpecial === 'win3x' ? '0 (Auto Win 3x)' : playerRes.finalNum)}*`,
      mentions: [targetPlayer]
    }, { quoted: msg });

    const botRaw = Math.floor(Math.random() * 37);
    const botRes = hitungReme(botRaw);

    await sock.sendMessage(remoteJid, {
      text: `🤖 *Bot* langsung balas SPIN!\n🎲 Angka Keluar: *${botRaw}*\n➕ Hasil Reme: *${botRes.isSpecial === 'autolose' ? '9 (Auto Lose)' : (botRes.isSpecial === 'win3x' ? '0 (Auto Win 3x)' : botRes.finalNum)}*`
    });

    return await processBotRoundEnd(sock, remoteJid, game, playerRaw, botRaw);
  }
}

module.exports = spinCommand;
