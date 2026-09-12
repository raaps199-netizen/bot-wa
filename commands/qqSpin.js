const { resolveUserKey } = require('../utils/helper');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hitungQQ(angka) {
  let remeVal = angka % 10;
  let desc = `${remeVal}`;
  if (remeVal === 0) desc = `0 (Auto Win 3x)`;
  else if (remeVal === 1) desc = `1 (Auto Lose)`;
  return { remeVal, desc };
}

/**
 * classify: nentuin "kelas" hasil QQ.
 * - 'win'    -> remeVal 0 (dari 10,20,...,100). Ngalahin semua kelas lain,
 *               KECUALI ketemu 'win' lagi -> seri.
 * - 'lose'   -> remeVal 1 (dari 1,11,...,91). Kalah dari semua kelas lain,
 *               KECUALI ketemu 'lose' lagi -> seri.
 * - 'normal' -> remeVal 2-9, dibandingin angka biasa.
 * ("3x" di teks cuma istilah/nama, TIDAK ngali-in poin/pot.)
 */
function classify(remeVal) {
  if (remeVal === 0) return 'win';
  if (remeVal === 1) return 'lose';
  return 'normal';
}

/**
 * compareQQ: bandingin dua remeVal, return 'a' | 'b' | 'tie'.
 */
function compareQQ(remeValA, remeValB) {
  const ca = classify(remeValA);
  const cb = classify(remeValB);

  if (ca === 'win' && cb === 'win') return 'tie';
  if (ca === 'lose' && cb === 'lose') return 'tie';
  if (ca === 'win') return 'a';
  if (cb === 'win') return 'b';
  if (ca === 'lose') return 'b';
  if (cb === 'lose') return 'a';

  if (remeValA > remeValB) return 'a';
  if (remeValB > remeValA) return 'b';
  return 'tie';
}

async function qqSpinCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const rawSenderId = msg.key.participant || remoteJid;
    const senderId = resolveUserKey(global.db, rawSenderId);

    const game = global.db.game?.[remoteJid];

    if (!game || game.type !== 'qq' || game.status !== 'playing') {
      return;
    }

    if (game.mode === 'bot') {
      if (senderId !== game.player) {
        await sock.sendMessage(remoteJid, { text: `❌ Bukan giliran kamu atau bukan pemain game ini!` }, { quoted: msg });
        return;
      }

      const pName = senderId.split('@')[0];

      const pRoll = Math.floor(Math.random() * 100);
      const pCalc = hitungQQ(pRoll);
      game.scores[senderId].currentRoll = pRoll;
      game.scores[senderId].currentReme = pCalc.remeVal;

      await sock.sendMessage(remoteJid, {
        text: `🎰 @${pName} melakukan SPIN!\n🎲 Angka Keluar: *${pRoll}*\n➕ Hasil QQ: *${pCalc.desc}*`,
        mentions: [senderId]
      }, { quoted: msg });

      await delay(1200);

      const botRoll = Math.floor(Math.random() * 100);
      const botCalc = hitungQQ(botRoll);
      game.botScore.currentRoll = botRoll;
      game.botScore.currentReme = botCalc.remeVal;

      await sock.sendMessage(remoteJid, {
        text: `🤖 Bot melakukan SPIN!\n🎲 Angka Keluar: *${botRoll}*\n➕ Hasil QQ: *${botCalc.desc}*`
      });

      await delay(1200);

      const roundResult = compareQQ(pCalc.remeVal, botCalc.remeVal);
      let roundWinner = '';
      if (roundResult === 'a') {
        game.scores[senderId].wins = (game.scores[senderId].wins || 0) + 1;
        roundWinner = `@${pName}`;
      } else if (roundResult === 'b') {
        game.botScore.wins = (game.botScore.wins || 0) + 1;
        roundWinner = `Bot`;
      } else {
        roundWinner = `Seri ( DRAW )`;
      }

      await sock.sendMessage(remoteJid, {
        text: `📊 *HASIL RONDE ${game.round}*\n\n• @${pName} : ${pRoll} (QQ: ${pCalc.desc})\n• Bot : ${botRoll} (QQ: ${botCalc.desc})\n\n🏆 Pemenang Ronde ini: ${roundWinner}!`,
        mentions: [senderId]
      });

      await delay(1200);

      if (game.round < 3) {
        game.round++;
        await sock.sendMessage(remoteJid, {
          text: `▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${pName} ketik *.spinqq*.`,
          mentions: [senderId]
        });
      } else {
        let pWins = game.scores[senderId].wins || 0;
        let bWins = game.botScore.wins || 0;

        let finalSummary = `🏁 *PERMAINAN QQ SELESAI!*\n\nSkor Akhir:\n• @${pName} : ${pWins} Win\n• Bot : ${bWins} Win`;

        let totalPot = game.taruhan * 2;

        if (!global.db.users[senderId]) global.db.users[senderId] = { score: 0 };

        if (pWins > bWins) {
          global.db.users[senderId].score += totalPot;
          finalSummary += `\n\n👑 Pemenang Utama: @${pName}!\n🎉 Selamat! Total Pot *${totalPot} Poin* masuk ke akun kamu!`;
        } else if (bWins > pWins) {
          finalSummary += `\n\n👑 Pemenang Utama: Bot!\n💀 @${pName} kalah, Total Pot *${totalPot} Poin* melayang ke Bot!`;
        } else {
          global.db.users[senderId].score += game.taruhan;
          finalSummary += `\n\n🤝 Hasil Seri! Taruhan *${game.taruhan} Poin* dikembalikan ke kamu.`;
        }

        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        delete global.db.game[remoteJid];

        await sock.sendMessage(remoteJid, {
          text: finalSummary,
          mentions: [senderId]
        });
      }

    } else if (game.mode === 'pvp') {
      const { p1, p2 } = game;

      if (senderId !== p1 && senderId !== p2) {
        await sock.sendMessage(remoteJid, { text: `❌ Bukan giliran kamu atau bukan pemain game ini!` }, { quoted: msg });
        return;
      }

      if (!game.roundData) game.roundData = {};
      if (!game.turn) game.turn = p1;

      if (senderId !== game.turn) {
        await sock.sendMessage(remoteJid, {
          text: `⏳ Bukan giliran lu! Sekarang giliran @${game.turn.split('@')[0]} buat *.spinqq*.`,
          mentions: [game.turn]
        }, { quoted: msg });
        return;
      }

      if (game.roundData[senderId] !== undefined) return;

      const pName = senderId.split('@')[0];
      const roll = Math.floor(Math.random() * 100);
      const calc = hitungQQ(roll);
      game.roundData[senderId] = calc.remeVal;

      await sock.sendMessage(remoteJid, {
        text: `🎰 @${pName} melakukan SPIN!\n🎲 Angka Keluar: *${roll}*\n➕ Hasil QQ: *${calc.desc}*`,
        mentions: [senderId]
      }, { quoted: msg });

      const otherPlayer = senderId === p1 ? p2 : p1;

      if (game.roundData[otherPlayer] === undefined) {
        game.turn = otherPlayer;
        await sock.sendMessage(remoteJid, {
          text: `➡️ Giliran @${otherPlayer.split('@')[0]} ketik *.spinqq*!`,
          mentions: [otherPlayer]
        });
        return;
      }

      await delay(800);

      const val1 = game.roundData[p1];
      const val2 = game.roundData[p2];
      const desc1 = hitungQQ(val1).desc;
      const desc2 = hitungQQ(val2).desc;
      const p1Name = p1.split('@')[0];
      const p2Name = p2.split('@')[0];

      const roundResult = compareQQ(val1, val2);
      let roundWinnerLabel;
      if (roundResult === 'a') {
        game.scores[p1].wins = (game.scores[p1].wins || 0) + 1;
        roundWinnerLabel = `@${p1Name}`;
      } else if (roundResult === 'b') {
        game.scores[p2].wins = (game.scores[p2].wins || 0) + 1;
        roundWinnerLabel = `@${p2Name}`;
      } else {
        roundWinnerLabel = `Seri ( DRAW )`;
      }

      await sock.sendMessage(remoteJid, {
        text: `📊 *HASIL RONDE ${game.round}*\n\n• @${p1Name} : QQ ${desc1}\n• @${p2Name} : QQ ${desc2}\n\n🏆 Pemenang Ronde ini: ${roundWinnerLabel}!`,
        mentions: [p1, p2]
      });

      await delay(1200);

      const p1Wins = game.scores[p1].wins || 0;
      const p2Wins = game.scores[p2].wins || 0;
      const winningTarget = 2; // best of 3
      const isGameOver = p1Wins >= winningTarget || p2Wins >= winningTarget || game.round >= 3;

      if (isGameOver) {
        let finalSummary = `🏁 *PERMAINAN QQ SELESAI!*\n\nSkor Akhir:\n• @${p1Name} : ${p1Wins} Win\n• @${p2Name} : ${p2Wins} Win`;
        const totalPot = game.taruhan * 2;

        if (!global.db.users[p1]) global.db.users[p1] = { score: 0 };
        if (!global.db.users[p2]) global.db.users[p2] = { score: 0 };

        // Taruhan kedua pemain sudah dipotong di depan saat .terimaqq
        // (lihat qqAcceptReject.js), jadi di sini cukup bayar pot ke pemenang.
        if (p1Wins > p2Wins) {
          global.db.users[p1].score += totalPot;
          finalSummary += `\n\n👑 Pemenang Utama: @${p1Name}!\n🎉 Total Pot *${totalPot} Poin* masuk ke akun @${p1Name}!`;
        } else if (p2Wins > p1Wins) {
          global.db.users[p2].score += totalPot;
          finalSummary += `\n\n👑 Pemenang Utama: @${p2Name}!\n🎉 Total Pot *${totalPot} Poin* masuk ke akun @${p2Name}!`;
        } else {
          global.db.users[p1].score += game.taruhan;
          global.db.users[p2].score += game.taruhan;
          finalSummary += `\n\n🤝 Hasil Seri! Taruhan *${game.taruhan} Poin* masing-masing dikembalikan.`;
        }

        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        delete global.db.game[remoteJid];

        await sock.sendMessage(remoteJid, { text: finalSummary, mentions: [p1, p2] });
        return;
      }

      game.round++;
      game.roundData = {};
      game.turn = p1;

      await sock.sendMessage(remoteJid, {
        text: `▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${p1Name} ketik *.spinqq*.`,
        mentions: [p1]
      });
    }

  } catch (err) {
    console.error('Error di qqSpinCommand:', err);
  }
}

module.exports = qqSpinCommand;
