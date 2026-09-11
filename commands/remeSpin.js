function hitungReme(angka) {
  // Aturan angka spesial 0 dan 9
  if (angka === 0) return { finalNum: 0, isSpecial: 'win3x' };
  if (angka === 9) return { finalNum: -1, isSpecial: 'autolose' }; // 9 auto lose

  // Penjumlahan digit (Contoh: 17 -> 1+7 = 8)
  let sum = String(angka).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  
  // Jika hasil penjumlahannya masih belasan/puluhan (misal 18 -> 1+8=9), ringkas lagi jadi satu digit
  while (sum > 9) {
    sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }

  if (sum === 9) return { finalNum: -1, isSpecial: 'autolose' };
  if (sum === 0) return { finalNum: 0, isSpecial: 'win3x' };

  return { finalNum: sum, isSpecial: null };
}

async function spinCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const senderId = msg.key.participant || remoteJid;
  const game = global.db?.game?.[remoteJid];

  if (!game || game.type !== 'reme') {
    return; // Bukan sesi game Reme, biarkan dilewati handler lain
  }

  const expectedPlayer = game.players[game.currentTurnIndex];
  if (senderId !== expectedPlayer) {
    return await sock.sendMessage(remoteJid, { text: `⚠️ Sabar, bro! Sekarang bukan giliran lo buat spin.` }, { quoted: msg });
  }

  // Lempar angka random kasino 0 sampai 36 ala roulete/spin
  const rawSpin = Math.floor(Math.random() * 37);
  const result = hitungReme(rawSpin);

  await sock.sendMessage(remoteJid, {
    text: `🎰 @${senderId.split('@')[0]} melakukan SPIN!\n🎲 Angka Keluar: *${rawSpin}*\n➕ Hasil Reme: *${result.isSpecial === 'autolose' ? '9 (Auto Lose)' : (result.isSpecial === 'win3x' ? '0 (Auto Win 3x)' : result.finalNum)}*`,
    mentions: [senderId]
  }, { quoted: msg });

  // Simpan hasil spin ronde ini
  game.roundData[senderId] = { raw: rawSpin, ...result };

  // Geser giliran ke player berikutnya
  game.currentTurnIndex++;

  // Jika semua player sudah spin di ronde ini (1 ronde selesai: Player 1 & Player 2)
  if (game.currentTurnIndex >= game.players.length) {
    const [p1, p2] = game.players;
    const d1 = game.roundData[p1];
    const d2 = game.roundData[p2];

    let roundWinner = null;

    // Logika penentuan pemenang ronde
    // Aturan 0 (Auto win) vs 9 (Auto lose) vs Angka biasa
    if (d1.isSpecial === 'autolose' && d2.isSpecial !== 'autolose') {
      roundWinner = p2;
    } else if (d2.isSpecial === 'autolose' && d1.isSpecial !== 'autolose') {
      roundWinner = p1;
    } else if (d1.isSpecial === 'win3x' && d2.isSpecial !== 'win3x') {
      roundWinner = p1;
    } else if (d2.isSpecial === 'win3x' && d1.isSpecial !== 'win3x') {
      roundWinner = p2;
    } else {
      // Adu besar angka final
      if (d1.finalNum > d2.finalNum) roundWinner = p1;
      else if (d2.finalNum > d1.finalNum) roundWinner = p2;
      else roundWinner = 'tie'; // Seri / Tie otomatis lose di aturan kasino, tapi kita bikin netral atau ulang/seri
    }

    let summaryText = `📊 *HASIL RONDE ${game.round}*\n\n`;
    summaryText += `• @${p1.split('@')[0]} : ${d1.raw} (Reme: ${d1.finalNum})\n`;
    summaryText += `• @${p2.split('@')[0]} : ${d2.raw} (Reme: ${d2.finalNum})\n\n`;

    if (roundWinner === 'tie') {
      summaryText += `⚖️ Ronde ${game.round} *SERI*! Poin tidak bertambah.`;
    } else {
      game.scores[roundWinner]++;
      summaryText += `🏆 Pemenang Ronde ini: @${roundWinner.split('@')[0]}!`;
    }

    await sock.sendMessage(remoteJid, { text: summaryText, mentions: [p1, p2] }, { quoted: msg });

    // Cek apakah sudah mencapai 3 ronde
    if (game.round >= game.maxRound) {
      // Selesaikan game, hitung siapa menang terbanyak
      const scoreP1 = game.scores[p1];
      const scoreP2 = game.scores[p2];

      let finalMsg = `🏁 *PERMAINAN REME SELESAI!*\n\nSkor Akhir:\n• @${p1.split('@')[0]} : ${scoreP1} Win\n• @${p2.split('@')[0]} : ${scoreP2} Win\n\n`;

      if (scoreP1 > scoreP2) {
        finalMsg += `👑 JUARA UTAMA: @${p1.split('@')[0]}!`;
      } else if (scoreP2 > scoreP1) {
        finalMsg += `👑 JUARA UTAMA: @${p2.split('@')[0]}!`;
      } else {
        finalMsg += `🤝 Pertandingan berakhir *SERI*!`;
      }

      delete global.db.game[remoteJid];
      await sock.sendMessage(remoteJid, { text: finalMsg, mentions: [p1, p2] });
      return;
    }

    // Lanjut ke ronde berikutnya
    game.round++;
    game.currentTurnIndex = 0; // Reset ke player pertama lagi
    game.roundData = {};

    await sock.sendMessage(remoteJid, {
      text: `▶️ Lanjut ke *Ronde ${game.round}*!\nSilakan @${p1.split('@')[0]} ketik *.spin* duluan.`,
      mentions: [p1]
    });

  } else {
    // Beritahu giliran player berikutnya
    const nextPlayer = game.players[game.currentTurnIndex];
    await sock.sendMessage(remoteJid, {
        text: `👉 Giliran selanjutnya: @${nextPlayer.split('@')[0]} (Ketik *.spin*)`,
        mentions: [nextPlayer]
    });
  }
}

module.exports = spinCommand;
  
