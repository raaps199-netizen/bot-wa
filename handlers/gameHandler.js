const config = require('../config');

// Tempat menyimpan state/sesi game yang sedang berlangsung
const activeGames = {
  math: new Map(),
  tebakbendera: new Map(),
  tebakkata: new Map(),
  tebakgambar: new Map()
};

/**
 * Memeriksa apakah pesan yang masuk merupakan jawaban dari game yang aktif.
 * @returns {Promise<boolean>} Return true jika pesan adalah jawaban game (agar tidak diproses sebagai command lain)
 */
async function handleGameAnswer(sock, msg, text) {
  const remoteJid = msg.key.remoteJid;
  const userAnswer = text.trim().toLowerCase();

  // 1. CEK GAME MATH
  if (activeGames.math.has(remoteJid)) {
    const game = activeGames.math.get(remoteJid);
    if (userAnswer === String(game.answer)) {
      clearTimeout(game.timeout);
      activeGames.math.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // 2. CEK GAME TEBAK BENDERA
  if (activeGames.tebakbendera.has(remoteJid)) {
    const game = activeGames.tebakbendera.get(remoteJid);
    if (userAnswer === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakbendera.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // 3. CEK GAME TEBAK KATA
  if (activeGames.tebakkata.has(remoteJid)) {
    const game = activeGames.tebakkata.get(remoteJid);
    if (userAnswer === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakkata.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  // 4. CEK GAME TEBAK GAMBAR
  if (activeGames.tebakgambar.has(remoteJid)) {
    const game = activeGames.tebakgambar.get(remoteJid);
    if (userAnswer === game.answer.toLowerCase()) {
      clearTimeout(game.timeout);
      activeGames.tebakgambar.delete(remoteJid);
      await sock.sendMessage(remoteJid, {
        text: `🎉 *Selamat!* Jawaban kamu benar: *${game.answer}*`
      }, { quoted: msg });
      return true;
    }
  }

  return false;
}

module.exports = {
  activeGames,
  handleGameAnswer
};
