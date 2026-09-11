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

async function processRoundEndOrNext(sock, remoteJid, game) {
  const [p1, p2] = game.players;
  const d1 = game.roundData[p1];
  const d2 = game.roundData[p2];

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

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isPlayingWithBot = p2 === botNumber;

  let summaryText = `📊 *HASIL RONDE ${game.round}*\n\n`;
  summaryText += `• @${p1.split('@')[0]} : ${d1.raw} (Reme: ${d1.finalNum})\n`;
  summaryText += `• @${p2.split('@')[0]} ${isPlayingWithBot ? '(Bot)' : ''} : ${d2.raw} (Reme: ${d2.finalNum})\n\n`;

  if (roundWinner === 'tie') {
    summaryText += `⚖️ Ronde ${game.round} *SERI*! Poin tidak bertambah.`;
  } else {
    game.scores[roundWinner]++;
    summaryText += `🏆 Pemenang Ronde ini: @${roundWinner.split('@')[0]}!`;
  }

  await sock.sendMessage(remoteJid, { text: summaryText, mentions: [p1, p2] });

  // Cek apakah sudah 3 ronde
  if (game.round >= game.maxRound) {
    const scoreP1 = game.scores[p1];
    const scoreP2 = game.scores[p2];

    let finalMsg = `🏁 *PERMAINAN REME SELESAI!*\n\nSkor Akhir:\n• @${p1.split('@')[0]} : ${scoreP1} Win\n• @${p2.split('@')[0]} ${isPlayingWithBot ? '(Bot)' : ''} : ${scoreP2} Win\n\n`;

    if (scoreP1 > scoreP2) {
      finalMsg += `👑 Pemenang Utama: @${p1.split('@')[0]}!`;
      if (!isPlayingWithBot && game.bet > 0) {
        const totalPrize = game.bet * 2;
        global.db.users[p1].triviaScore += totalPrize;
        finalMsg += `\n💰 Berhasil ngeruk total taruhan sebesar *+${totalPrize} Poin*!`;
      }
    } else if (scoreP2 > scoreP1) {
      finalMsg += `👑 Pemenang Utama: @${p2.split('@')[0]}!`;
      if (!isPlayingWithBot && game.bet > 0) {
        const totalPrize = game.bet * 2;
        global.db.users[p2].triviaScore += totalPrize;
        finalMsg += `\n💰 Berhasil ngeruk total taruhan sebesar *+${totalPrize} Poin*!`;
      }
    } else {
      finalMsg += `🤝 Pertandingan berakhir *SERI*!`;
      if (!isPlayingWithBot && game.bet > 0) {
        // Balikin poin taruhan utuh kalau seri
        global.db.users[p1].triviaScore += game.bet;
        global.db.users[p2].triviaScore += game.bet;
        finalMsg += `\n🔄 Taruhan masing-masing ${game.bet} poin dikembalikan utuh.`;
      }
    }

    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, { text: finalMsg, mentions: [p1, p2] });
    return;
  }

  // Lanjut ronde berikutnya
  game.round++;
  game.currentTurnIndex = 0;
  game.roundData = {};

  await sock.sendMessage(remoteJid, {
    text: `▶️ Lanjut ke *Ronde ${game.round}*!\nSilakan @${p1.split('@')[0]} ketik *.spin* duluan.`,
    mentions: [p1]
  });
}

async function spinCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const game = global.db?.game?.[remoteJid];

  if (!game || game.type !== 'reme') return;

  const expectedPlayer = game.players[game.currentTurnIndex];
  if (senderId !== expectedPlayer) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Sabar bre, bukan giliran lo!` }, { quoted: msg });
  }

  const rawSpin = Math.floor(Math.random() * 37);
  const result = hitungReme(rawSpin);

  await sock.sendMessage(remoteJid, {
    text: `🎰 @${senderId.split('@')[0]} melakukan SPIN!\n🎲 Angka Keluar: *${rawSpin}*\n➕ Hasil Reme: *${result.isSpecial === 'autolose' ? '9 (Auto Lose)' : (result.isSpecial === 'win3x' ? '0 (Auto Win 3x)' : result.finalNum)}*`,
    mentions: [senderId]
  }, { quoted: msg });

  game.roundData[senderId] = { raw: rawSpin, ...result };
  game.currentTurnIndex++;

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isPlayingWithBot = game.players.includes(botNumber);

  if (isPlayingWithBot && game.currentTurnIndex < game.players.length && game.players[game.currentTurnIndex] === botNumber) {
    setTimeout(async () => {
      const botRawSpin = Math.floor(Math.random() * 37);
      const botResult = hitungReme(botRawSpin);

      await sock.sendMessage(remoteJid, {
        text: `🤖 *Bot* ikut melakukan SPIN!\n🎲 Angka Keluar: *${botRawSpin}*\n➕ Hasil Reme: *${botResult.isSpecial === 'autolose' ? '9 (Auto Lose)' : (botResult.isSpecial === 'win3x' ? '0 (Auto Win 3x)' : botResult.finalNum)}*`,
        mentions: [botNumber]
      });

      game.roundData[botNumber] = { raw: botRawSpin, ...botResult };
      game.currentTurnIndex++;

      await processRoundEndOrNext(sock, remoteJid, game);
    }, 1500);

    return;
  }

  if (game.currentTurnIndex >= game.players.length) {
    await processRoundEndOrNext(sock, remoteJid, game);
  } else {
    const nextPlayer = game.players[game.currentTurnIndex];
    await sock.sendMessage(remoteJid, {
      text: `👉 Giliran selanjutnya: @${nextPlayer.split('@')[0]} (Ketik *.spin*)`,
      mentions: [nextPlayer]
    });
  }
}

module.exports = spinCommand;
