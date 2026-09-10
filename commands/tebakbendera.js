const axios = require('axios');

async function tebakbenderaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  try {
    const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera.json');
    const soal = res.data[Math.floor(Math.random() * res.data.length)];

    const caption = `🎌 *TEBAK BENDERA*\n\n` +
      `Bendera negara manakah ini?\n\n` +
      `💡 *Jawaban:* ||${soal.name}|| _(Ketuk spoiler jika menyerah)_`;

    await sock.sendMessage(remoteJid, {
      image: { url: soal.img },
      caption: caption
    }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil kuis bendera.' }, { quoted: msg });
  }
}

module.exports = tebakbenderaCommand;
