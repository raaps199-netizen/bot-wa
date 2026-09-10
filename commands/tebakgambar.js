const axios = require('axios');

async function tebakgambarCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  try {
    const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json');
    const soal = res.data[Math.floor(Math.random() * res.data.length)];

    const caption = `🖼️ *TEBAK GAMBAR*\n\n` +
      `Clue: ${soal.deskripsi}\n\n` +
      `💡 *Jawaban:* ||${soal.jawaban}|| _(Ketuk spoiler jika menyerah)_`;

    await sock.sendMessage(remoteJid, {
      image: { url: soal.img },
      caption: caption
    }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil soal tebak gambar.' }, { quoted: msg });
  }
}

module.exports = tebakgambarCommand;
