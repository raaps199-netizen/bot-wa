const axios = require('axios');
const { activeGames } = require('../handlers/gameHandler');

async function tebakkataCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  if (activeGames.tebakkata.has(remoteJid)) {
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada sesi Tebak Kata yang berlangsung! Jawab dengan *.jawab <jawaban>*'
    }, { quoted: msg });
    return;
  }

  try {
    // Ambil soal acak dari API publik
    const response = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakkata.json');
    const dataList = response.data;
    const q = dataList[Math.floor(Math.random() * dataList.length)];

    const answer = q.jawaban.trim();

    const timeout = setTimeout(async () => {
      if (activeGames.tebakkata.has(remoteJid)) {
        activeGames.tebakkata.delete(remoteJid);
        await sock.sendMessage(remoteJid, {
          text: `⏱️ *Waktu Habis!*\nJawaban yang benar adalah: *${answer}*`
        });
      }
    }, 60000);

    activeGames.tebakkata.set(remoteJid, {
      answer: answer,
      timeout: timeout
    });

    const caption = `
📝 *TEBAK KATA*

Soal: *${q.soal}*
Clue: ${q.clue || '-'}

⏱️ Waktu: *60 detik*
Ketik *.jawab <jawaban>* untuk menjawab!
`.trim();

    await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

  } catch (err) {
    console.error('Error tebakkata API:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil soal dari server, coba lagi nanti.' }, { quoted: msg });
  }
}

module.exports = tebakkataCommand;
