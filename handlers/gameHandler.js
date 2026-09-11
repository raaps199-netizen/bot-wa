async function handleGameAnswer(sock, msg, userText) {
  const remoteJid = msg.key.remoteJid;
  const gameSession = global.db?.game?.[remoteJid];

  if (!gameSession) return false;

  const textLower = userText.trim().toLowerCase();

  // Handle Menyerah
  if (textLower === '.nyerah' || textLower === 'nyerah') {
    if (gameSession.timer) clearTimeout(gameSession.timer);
    delete global.db.game[remoteJid];
    await sock.sendMessage(remoteJid, {
      text: `🏳️ Kamu menyerah!\nJawaban yang benar: *${gameSession.jawabanTeks || gameSession.jawabanBenar}*`
    }, { quoted: msg });
    return true;
  }

  // Handle Trivia (Pilihan a, b, c, atau d)
  if (gameSession.type === 'trivia') {
    // Jika input bukan salah satu dari a, b, c, d, biarkan pesan diabaikan (bukan jawaban kuis)
    if (!['a', 'b', 'c', 'd'].includes(textLower)) {
      return false;
    }

    // Batalkan timer waktu habis
    if (gameSession.timer) clearTimeout(gameSession.timer);

    if (textLower === gameSession.jawabanOpsi) {
      delete global.db.game[remoteJid];
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat, jawaban kamu BENAR!*\n\nJawaban: *${gameSession.jawabanTeks}*`
      }, { quoted: msg });
    } else {
      delete global.db.game[remoteJid];
      await sock.sendMessage(remoteJid, {
        text: `❌ *Jawaban kamu SALAH!*\n\nJawaban yang benar: *${gameSession.jawabanTeks}*`
      }, { quoted: msg });
    }
    return true;
  }

  return false;
}

module.exports = { handleGameAnswer };
