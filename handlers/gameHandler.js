// Sesi game aktif
const activeGames = {
  math: new Map(),
  tebakbendera: new Map(),
  tebakkata: new Map(),
  tebakgambar: new Map(),
  trivia: new Map()
};

/**
 * Pengecekan jawaban game via command (.jawab / /jawab)
 */
async function handleGameAnswer(sock, msg, userAnswer) {
  const remoteJid = msg.key.remoteJid;
  const input = userAnswer.trim().toLowerCase();

  // Cek Math
  if (activeGames.math.has(remoteJid)) {
    const game = activeGames.math.get(remoteJid);
    if (input === String(game.answer).toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.math.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // Cek Tebak Bendera
  if (activeGames.tebakbendera.has(remoteJid)) {
    const game = activeGames.tebakbendera.get(remoteJid);
    if (input === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakbendera.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // Cek Tebak Kata
  if (activeGames.tebakkata.has(remoteJid)) {
    const game = activeGames.tebakkata.get(remoteJid);
    if (input === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakkata.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // Cek Tebak Gambar
  if (activeGames.tebakgambar.has(remoteJid)) {
    const game = activeGames.tebakgambar.get(remoteJid);
    if (input === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakgambar.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // Cek Trivia
  if (activeGames.trivia.has(remoteJid)) {
    const game = activeGames.trivia.get(remoteJid);
    if (input === game.answer.toLowerCase() || input === game.fullAnswer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.trivia.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}. ${game.fullAnswer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // Jika ada game aktif tapi jawaban salah
  const isAnyGameActive = activeGames.math.has(remoteJid) ||
                          activeGames.tebakbendera.has(remoteJid) ||
                          activeGames.tebakkata.has(remoteJid) ||
                          activeGames.tebakgambar.has(remoteJid) ||
                          activeGames.trivia.has(remoteJid);

  if (isAnyGameActive) {
    await sock.sendMessage(remoteJid, {
      text: `❌ Jawaban *${userAnswer}* salah! Coba lagi.`
    }, { quoted: msg });
    return true;
  }

  return false;
}

module.exports = {
  activeGames,
  handleGameAnswer
};
