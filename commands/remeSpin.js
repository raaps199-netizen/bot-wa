// File: commands/remeSpin.js
const helper = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils');

// Helper wrapper untuk menambah/mengurangi poin dengan aman (support berbagai macam signature helper)
function safeAddPoints(userJid, amount) {
  if (typeof helper.addPoints === 'function') {
    try {
      // Coba signature (db, jid, amount)
      helper.addPoints(global.db, userJid, amount);
    } catch (e) {
      try {
        // Coba signature (jid, amount) atau (jid, category, amount)
        helper.addPoints(userJid, 'reme', amount);
      } catch (err) {      }
    }
  }
}

function safeDeductPoints(userJid, amount) {
  if (typeof helper.deductPoints === 'function') {
    try {
      helper.deductPoints(global.db, userJid, amount);
    } catch (e) {
      try {
        helper.deductPoints(userJid, amount);
      } catch (err) {      }
    }
  }
}

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

function fmtResult(res) {
  if (res.isSpecial === 'autolose') return '9 (Auto Lose)';
  if (res.isSpecial === 'win3x') return '0 (Auto Win 3x)';
  return res.finalNum;
}

function baseNum(jid) {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
}

async function finishGame(sock, remoteJid, game, isVsBot) {
  try {
    const [p1, p2] = game.players;
    const scoreP1 = game.scores[p1] || 0;
    const scoreP2 = game.scores[p2] || 0;
    const label2 = isVsBot ? 'Bot' : `@${p2.split('@')[0]}`;
    const mentions = isVsBot ? [p1] : [p1, p2];

    let finalMsg = `🏁 *PERMAINAN REME SELESAI!*\n\nSkor Akhir:\n• @${p1.split('@')[0]} : ${scoreP1} Win\n• ${label2} : ${scoreP2} Win\n\n`;

    const bet = game.bet || 0;
    const potReward = bet * 2;

    if (scoreP1 > scoreP2) {
      finalMsg += `👑 Pemenang Utama: @${p1.split('@')[0]}!`;
      if (bet > 0) {
        if (isVsBot) {
          safeAddPoints(p1, bet);
          finalMsg += `\n💰 Menang lawan bot, dapet hadiah *+${bet} Poin*!`;
        } else {
          safeAddPoints(p1, potReward);
          finalMsg += `\n💰 @${p1.split('@')[0]} menang, mengambil Total Pot *+${potReward} Poin*!`;
        }
      }
    } else if (scoreP2 > scoreP1) {
      finalMsg += `👑 Pemenang Utama: ${isVsBot ? '*Bot Kasino*' : '@' + p2.split('@')[0]}!`;
      if (bet > 0) {
        if (isVsBot) {
          safeDeductPoints(p1, bet);
          finalMsg += `\n💀 Kalah lawan bot, poin lu berkurang *-${bet} Poin*!`;
        } else {
          safeAddPoints(p2, potReward);
          finalMsg += `\n💀 @${p1.split('@')[0]} kalah, Total Pot *${potReward} Poin* ditarik ke @${p2.split('@')[0]}!`;
        }
      }
    } else {
      finalMsg += `🤝 Pertandingan berakhir *SERI*!`;
      if (bet > 0 && !isVsBot) {
        safeAddPoints(p1, bet);
        safeAddPoints(p2, bet);
        finalMsg += ` Poin lu berdua (*${bet}*) aman dikembalikan!`;
      } else {
        finalMsg += ` Poin aman.`;
      }
    }

    if (typeof global.saveDatabase === 'function') global.saveDatabase();

    // Hapus sesi game
    delete global.db.game[remoteJid];

    return await sock.sendMessage(remoteJid, { text: finalMsg, mentions });
  } catch (err) {
    console.error('Error saat finishGame Reme:', err);
    delete global.db.game[remoteJid];
  }
}

async function processRoundEnd(sock, remoteJid, game, rolls, isVsBot) {
  const [p1, p2] = game.players;
  const raw1 = rolls[p1];
  const raw2 = rolls[p2];
  const d1 = hitungReme(raw1);
  const d2 = hitungReme(raw2);

  let roundWinner = null;
  if (d1.isSpecial === 'autolose' && d2.isSpecial !== 'autolose') roundWinner = p2;
  else if (d2.isSpecial === 'autolose' && d1.isSpecial !== 'autolose') roundWinner = p1;
  else if (d1.isSpecial === 'win3x' && d2.isSpecial !== 'win3x') roundWinner = p1;
  else if (d2.isSpecial === 'win3x' && d1.isSpecial !== 'win3x') roundWinner = p2;
  else {
    if (d1.finalNum > d2.finalNum) roundWinner = p1;
    else if (d2.finalNum > d1.finalNum) roundWinner = p2;
    else roundWinner = 'tie';
  }

  const mentions = isVsBot ? [p1] : [p1, p2];

  let summaryText = `📊 *HASIL RONDE ${game.round}*\n\n`;
  summaryText += `• @${p1.split('@')[0]} : ${raw1} (Reme: ${fmtResult(d1)})\n`;
  summaryText += `• ${isVsBot ? 'Bot' : '@' + p2.split('@')[0]} : ${raw2} (Reme: ${fmtResult(d2)})\n\n`;

  if (roundWinner === 'tie') {
    summaryText += `⚖️ Ronde ${game.round} *SERI*! Poin tidak bertambah.`;
  } else {
    game.scores[roundWinner] = (game.scores[roundWinner] || 0) + 1;
    const winnerLabel = roundWinner === p1
      ? `@${p1.split('@')[0]}${isVsBot ? ' (Lu)' : ''}`
      : (isVsBot ? 'Bot' : `@${p2.split('@')[0]}`);
    summaryText += `🏆 Pemenang Ronde ini: ${winnerLabel}!`;
  }

  await sock.sendMessage(remoteJid, { text: summaryText, mentions });

  const scoreP1 = game.scores[p1] || 0;
  const scoreP2 = game.scores[p2] || 0;
  const winningTarget = Math.ceil((game.maxRound || 3) / 2); // Best of 3 -> Butuh 2 kemenangan
  const isGameOver = scoreP1 >= winningTarget || scoreP2 >= winningTarget || game.round >= (game.maxRound || 3);

  if (isGameOver) {
    return await finishGame(sock, remoteJid, game, isVsBot);
  }

  // Naikkan ronde jika game belum selesai
  game.round++;
  game.roundData = {};
  game.currentTurnIndex = 0;

  const nextText = isVsBot
    ? `▶️ Lanjut ke *Ronde ${game.round}*!\nSilakan @${p1.split('@')[0]} ketik *.spin* lagi.`
    : `▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${p1.split('@')[0]} ketik *.spin*.`;

  await sock.sendMessage(remoteJid, { text: nextText, mentions: [p1] });
}

async function spinCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = getSenderId(msg, remoteJid);
    if (!senderId) return;

    const game = global.db?.game?.[remoteJid];
    if (!game || game.type !== 'reme') return;

    const isPlayingWithBot = game.mode === 'bot' || game.players.some(p => p.includes('bot'));

    if (isPlayingWithBot) {
      const targetPlayer = game.players.find(p => !p.includes('bot')) || senderId;
      const botNumber = game.players.find(p => p.includes('bot')) || 'bot@s.whatsapp.net';

      if (baseNum(senderId) !== baseNum(targetPlayer)) return;

      const playerRaw = Math.floor(Math.random() * 37);
      const playerRes = hitungReme(playerRaw);

      await sock.sendMessage(remoteJid, {
        text: `🎰 @${targetPlayer.split('@')[0]} melakukan SPIN!\n🎲 Angka Keluar: *${playerRaw}*\n➕ Hasil Reme: *${fmtResult(playerRes)}*`,
        mentions: [targetPlayer]
      }, { quoted: msg });

      const botRaw = Math.floor(Math.random() * 37);
      const botRes = hitungReme(botRaw);

      await sock.sendMessage(remoteJid, {
        text: `🤖 *Bot* langsung balas SPIN!\n🎲 Angka Keluar: *${botRaw}*\n➕ Hasil Reme: *${fmtResult(botRes)}*`
      });

      return await processRoundEnd(sock, remoteJid, game, { [targetPlayer]: playerRaw, [botNumber]: botRaw }, true);
    }

    // Perkelahian PvP (Player vs Player)
    if (!game.roundData) game.roundData = {};
    if (typeof game.currentTurnIndex !== 'number') game.currentTurnIndex = 0;

    const currentPlayer = game.players[game.currentTurnIndex];

    if (baseNum(senderId) !== baseNum(currentPlayer)) {
      return await sock.sendMessage(remoteJid, {
        text: `⏳ Bukan giliran lu! Sekarang giliran @${currentPlayer.split('@')[0]} buat *.spin*.`,
        mentions: [currentPlayer]
      }, { quoted: msg });
    }

    if (game.roundData[currentPlayer] !== undefined) return;

    const raw = Math.floor(Math.random() * 37);
    const res = hitungReme(raw);
    game.roundData[currentPlayer] = raw;

    await sock.sendMessage(remoteJid, {
      text: `🎰 @${currentPlayer.split('@')[0]} melakukan SPIN!\n🎲 Angka Keluar: *${raw}*\n➕ Hasil Reme: *${fmtResult(res)}*`,
      mentions: [currentPlayer]
    }, { quoted: msg });

    const otherPlayer = game.players.find(p => p !== currentPlayer);

    if (game.roundData[otherPlayer] === undefined) {
      game.currentTurnIndex = game.players.indexOf(otherPlayer);
      return await sock.sendMessage(remoteJid, {
        text: `➡️ Giliran @${otherPlayer.split('@')[0]} ketik *.spin*!`,
        mentions: [otherPlayer]
      });
    }

    const [p1, p2] = game.players;
    return await processRoundEnd(sock, remoteJid, game, { [p1]: game.roundData[p1], [p2]: game.roundData[p2] }, false);

  } catch (err) {
    console.error('Error di spinCommand:', err);
  }
}

module.exports = spinCommand;
    
