const axios = require('axios');

async function tebakkataCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  try {
    const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json');
    const soal = res.data[Math.floor(Math.random() * res.data.length)];

    const teks = `📝 *TEBAK KATA*\n\n` +
      `Soal: *${soal.soal}*\n` +
      `Clue: ${soal.clue}\n\n` +
      `💡 *Jawaban:* ||${soal.jawaban}|| _(Ketuk spoiler jika menyerah)_`;

    await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil kuis tebak kata.' }, { quoted: msg });
  }
}

module.exports = tebakkataCommand;
