const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hitungQQ(angka) {
  let remeVal = angka % 10;
  let desc = `${remeVal}`;
  if (angka === 0) desc = `0 (Auto Win 3x)`;
  else if (remeVal === 9 && angka !== 9) desc = `9 (Auto Lose)`;
  return { remeVal, desc };
}

async function qqSpinCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;
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

      // 1. Roll Player
      const pRoll = Math.floor(Math.random() * 100);
      const pCalc = hitungQQ(pRoll);
      game.scores[senderId].currentRoll = pRoll;
      game.scores[senderId].currentReme = pCalc.remeVal;

      // Kirim pesan spin player
      await sock.sendMessage(remoteJid, {
        text: `🎰 @${pName} melakukan SPIN!\n🎲 Angka Keluar: *${pRoll}*\n➕ Hasil QQ: *${pCalc.desc}*`,
        mentions: [senderId]
      }, { quoted: msg });

      await delay(1200); // Jeda sebelum bot spin

      // 2. Roll Bot
      const botRoll = Math.floor(Math.random() * 100);
      const botCalc = hitungQQ(botRoll);
      game.botScore.currentRoll = botRoll;
      game.botScore.currentReme = botCalc.remeVal;

      // Kirim pesan spin bot
      await sock.sendMessage(remoteJid, {
        text: `🤖 Bot melakukan SPIN!\n🎲 Angka Keluar: *${botRoll}*\n➕ Hasil QQ: *${botCalc.desc}*`
      });

      await delay(1200); // Jeda sebelum hasil ronde

      // Tentukan Pemenang Ronde
      let roundWinner = '';
      if (pCalc.remeVal > botCalc.remeVal) {
        game.scores[senderId].wins = (game.scores[senderId].wins || 0) + 1;
        roundWinner = `@${pName}`;
      } else if (botCalc.remeVal > pCalc.remeVal) {
        game.botScore.wins = (game.botScore.wins || 0) + 1;
        roundWinner = `Bot`;
      } else {
        roundWinner = `Seri ( DRAW )`;
      }

      // 3. Kirim Hasil Ronde
      await sock.sendMessage(remoteJid, {
        text: `📊 *HASIL RONDE ${game.round}*\n\n• @${pName} : ${pRoll} (QQ: ${pCalc.desc})\n• Bot : ${botRoll} (QQ: ${botCalc.desc})\n\n🏆 Pemenang Ronde ini: ${roundWinner}!`,
        mentions: [senderId]
      });

      await delay(1200); // Jeda sebelum lanjut ronde / selesai

      if (game.round < 3) {
        game.round++;
        // 4. Kirim Info Lanjut Ronde
        await sock.sendMessage(remoteJid, {
          text: `▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${pName} ketik *.spinqq*.`,
          mentions: [senderId]
        });
      } else {
        // Game Selesai
        let pWins = game.scores[senderId].wins || 0;
        let bWins = game.botScore.wins || 0;

        let finalSummary = `🏁 *PERMAINAN QQ SELESAI!*\n\nSkor Akhir:\n• @${pName} : ${pWins} Win\n• Bot : ${bWins} Win`;

        let totalPot = game.taruhan * 2;
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

    } else {
      // Logic PvP bisa disesuaikan menyusul kalau bot-mode udah aman
    }

  } catch (err) {
    console.error('Error di qqSpinCommand:', err);
  }
}

module.exports = qqSpinCommand;
