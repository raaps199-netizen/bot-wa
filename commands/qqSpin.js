function hitungQQ(angka) {
  // Simulasi logika nilai Reme/QQ angka belakang (misal 0 = Auto Win, atau mod 10, dll sesuai rules kamu)
  let remeVal = angka % 10;
  let desc = `${remeVal}`;
  if (angka === 0) desc = `0 (Auto Win 3x)`;
  else if (remeVal === 9 && angka !== 9) desc = `9 (Auto Lose)`; // sesuaikan rules
  return { remeVal, desc };
}

async function qqSpinCommand(sock, msg) {
  try {
    const remoteJid = msg.key.remoteJid;
    const senderId = msg.key.participant || remoteJid;
    const game = global.db.game?.[remoteJid];

    if (!game || game.type !== 'qq' || game.status !== 'playing') {
      return; // Abaikan jika tidak sedang main QQ
    }

    // Mode Lawan Bot
    if (game.mode === 'bot') {
      if (senderId !== game.player) {
        await sock.sendMessage(remoteJid, { text: `❌ Bukan giliran kamu atau kamu bukan pemain game ini!` }, { quoted: msg });
        return;
      }

      // Roll untuk Player
      const pRoll = Math.floor(Math.random() * 100);
      const pCalc = hitungQQ(pRoll);
      game.scores[senderId].currentRoll = pRoll;
      game.scores[senderId].currentReme = pCalc.remeVal;

      const pName = senderId.split('@')[0];
      let replyText = `🎰 @${pName} melakukan SPIN!\n🎲 Angka Keluar: *${pRoll}*\n➕ Hasil QQ: *${pCalc.desc}*`;

      // Bot otomatis spin setelah player
      const botRoll = Math.floor(Math.random() * 100);
      const botCalc = hitungQQ(botRoll);
      game.botScore.currentRoll = botRoll;
      game.botScore.currentReme = botCalc.remeVal;

      replyText += `\n\n🤖 Bot melakukan SPIN!\n🎲 Angka Keluar: *${botRoll}*\n➕ Hasil QQ: *${botCalc.desc}*`;

      // Tentukan Pemenang Ronde
      let roundWinner = '';
      // Contoh rule penentuan pemenang (misal nilai terbesar atau mendekati aturan tertentu)
      // Disini kita pakai perbandingan remeVal sederhana atau custom rule kamu
      if (pCalc.remeVal > botCalc.remeVal) {
        game.scores[senderId].wins = (game.scores[senderId].wins || 0) + 1;
        roundWinner = `@${pName}`;
      } else if (botCalc.remeVal > pCalc.remeVal) {
        game.botScore.wins = (game.botScore.wins || 0) + 1;
        roundWinner = `Bot`;
      } else {
        roundWinner = `Seri ( DRAW )`;
      }

      replyText += `\n\n📊 *HASIL RONDE ${game.round}*\n\n• @${pName} : ${pRoll} (QQ: ${pCalc.desc})\n• Bot : ${botRoll} (QQ: ${botCalc.desc})\n\n🏆 Pemenang Ronde ini: ${roundWinner}!`;

      if (game.round < 3) {
        game.round++;
        replyText += `\n\n▶️ Lanjut ke *Ronde ${game.round}*!\nGiliran @${pName} ketik *.spinqq*.`;
        await sock.sendMessage(remoteJid, { text: replyText, mentions: [senderId] }, { quoted: msg });
      } else {
        // Game Selesai (3 Ronde)
        let pWins = game.scores[senderId].wins || 0;
        let bWins = game.botScore.wins || 0;

        replyText += `\n\n🏁 *PERMAINAN QQ SELESAI!*\n\nSkor Akhir:\n• @${pName} : ${pWins} Win\n• Bot : ${bWins} Win`;

        let totalPot = game.taruhan * 2;
        if (pWins > bWins) {
          global.db.users[senderId].score += totalPot;
          replyText += `\n\n👑 Pemenang Utama: @${pName}!\n🎉 Selamat! Total Pot *${totalPot} Poin* masuk ke akun kamu!`;
        } else if (bWins > pWins) {
          replyText += `\n\n👑 Pemenang Utama: Bot!\n💀 @${pName} kalah, Total Pot *${totalPot} Poin* melayang ke Bot!`;
        } else {
          // Seri, kembalikan koin
          global.db.users[senderId].score += game.taruhan;
          replyText += `\n\n🤝 Hasil Seri! Taruhan *${game.taruhan} Poin* dikembalikan ke kamu.`;
        }

        if (typeof global.saveDatabase === 'function') global.saveDatabase();
        delete global.db.game[remoteJid];

        await sock.sendMessage(remoteJid, { text: replyText, mentions: [senderId] }, { quoted: msg });
      }

    } else {
      // Mode PvP
      if (senderId !== game.turn) {
        await sock.sendMessage(remoteJid, { text: `❌ Sabar, sekarang bukan giliran kamu!` }, { quoted: msg });
        return;
      }

      const roll = Math.floor(Math.random() * 100);
      const calc = hitungQQ(roll);
      game.scores[senderId].currentRoll = roll;
      game.scores[senderId].currentReme = calc.remeVal;

      const sName = senderId.split('@')[0];
      await sock.sendMessage(remoteJid, {
        text: `🎰 @${sName} melakukan SPIN!\n🎲 Angka Keluar: *${roll}*\n➕ Hasil QQ: *${calc.desc}*`,
        mentions: [senderId]
      }, { quoted: msg });

      // Ganti giliran antar pemain dalam ronde yang sama atau evaluasi ronde
      // (Bisa disesuaikan persis alur giliran PvP Reme)
    }

  } catch (err) {
    console.error('Error di qqSpinCommand:', err);
  }
}

module.exports = qqSpinCommand;
        
