// File: commands/remeSpin.js
const { getUserData, addPoints, deductPoints } = require('../utils/helper');
const { getSenderId } = require('../utils/jid-utils'); 

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
  return jid.split('@')[0].split(':')[0];
}

async function finishGame(sock, remoteJid, game, isVsBot) {
  const [p1, p2] = game.players;
  const scoreP1 = game.scores[p1];
  const scoreP2 = game.scores[p2];
  const label2 = isVsBot ? 'Bot' : `@${p2.split('@')[0]}`;
  const mentions = isVsBot ? [p1] : [p1, p2];

  let finalMsg = `🏁 *PERMAINAN REME SELESAI!*\n\nSkor Akhir:\n• @${p1.split('@')[0]} : ${scoreP1} Win\n• ${label2} : ${scoreP2} Win\n\n`;

  const potReward = game.bet * 2; 
  const refundAmount = game.bet;  

  if (scoreP1 > scoreP2) {
    finalMsg += `👑 Pemenang Utama: @${p1.split('@')[0]}!`;
    if (game.bet > 0) {
      if (isVsBot) {
        addPoints(remoteJid, p1, 'trivia', game.bet);
        finalMsg += `\n💰 Menang lawan bot, dapet hadiah *+${game.bet} Poin*!`;
      } else {
        addPoints(remoteJid, p1, 'trivia', potReward);
        finalMsg += `\n💰 @${p1.split('@')[0]} menang, mengambil Total Pot *+${potReward} Poin*!`;
      }
    }
  } else if (scoreP2 > scoreP1) {
    finalMsg += `👑 Pemenang Utama: ${isVsBot ? '*Bot Kasino*' : '@' + p2.split('@')[0]}!`;
    if (game.bet > 0) {
      if (isVsBot) {
        deductPoints(remoteJid, p1, game.bet);
        finalMsg += `\n💀 Kalah lawan bot, lu dipalak sebesar *-${game.bet} Poin*!`;
      } else {
        addPoints(remoteJid, p2, 'trivia', potReward);
        finalMsg += `\n💀 @${p1.split('@')[0]} kalah, Total Pot *${potReward} Poin* ditarik ke @${p2.split('@')[0]}!`;
      }
    }
  } else {
    finalMsg += `🤝 Pertandingan berakhir *SERI*!`;
    if (game.bet > 0 && !isVsBot) {
      addPoints(remoteJid, p1, 'trivia', refundAmount);
      addPoints(remoteJid, p2, 'trivia', refundAmount);
      finalMsg += ` Poin lu berdua (*${refundAmount}*) aman dikembalikan!`;
    } else {
      finalMsg += ` Poin aman.`;
    }
  }

  delete global.db.game[remoteJid];

  return await sock.sendMessage(remoteJid, { text: finalMsg, mentions });
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
    game.scores[roundWinner]++;
    const winnerLabel = roundWinner === p1
      ? `@${p1.split('@')[0]}${isVsBot ? ' (Lu)' : ''}`
      : (isVsBot ? 'Bot' : `@${p2.split('@')[0]}`);
    summaryText += `🏆 Pemenang Ronde ini: ${winnerLabel}!`;
  }

  await sock.sendMessage(remoteJid, { text: summaryText, mentions });

  const scoreP1 = game.scores[p1];
  const scoreP2 = game.scores[p2];
  const winningTarget = Math.ceil(game.maxRound / 2);
  const isGameOver = scoreP1 >= winningTarget || scoreP2 >= winningTarget || game.round >= game.maxRound;

  if (isGameOver) {
    return await finishGame(sock, remoteJid, game, isVsBot);
  }

  game.round++;
  game.roundData = {};
  game.currentTurnIndex = 0; 

  const nextText = isVsBot
    ? `▶️ Lanjut ke *Ronde ${game.round}*!\nSilakan @${p1.split('@')[0]} ketik *.spin* lagi.`
    : `▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${p1.split('@')[0]} ketik *.spin*.`;

  await sock.sendMessage(remoteJid, { text: nextText, mentions: [p1] });
}

async function spinCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = getSenderId(msg, remoteJid);
  if (!senderId) return;

  const game = global.db?.game?.[remoteJid];
  if (!game || game.type !== 'reme') return;

  const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
  const isPlayingWithBot = game.players.includes(botNumber);

  if (isPlayingWithBot) {
    const targetPlayer = game.players.find(p => p !== botNumber);

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
}

module.exports = spinCommand;
