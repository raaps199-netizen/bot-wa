const fetch = require('node-fetch');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

const categoryMap = {
  biologi: 17,
  fisika: 17,
  kimia: 17,
  sejarah: 23,
  geografi: 22,
  inggris: 10,
  indonesia: 9
};

const difficultyMap = {
  mudah: 'easy',
  sedang: 'medium',
  sulit: 'hard'
};

async function translateToId(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const json = await res.json();
    return json[0].map(item => item[0]).join('');
  } catch (e) {
    return text;
  }
}

function decodeHTML(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function triviaCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    await sock.sendMessage(remoteJid, { text: 'itu jawab dulu njir' }, { quoted: msg });
    return;
  }

  const kategoriInput = args[0]?.toLowerCase();
  const levelInput = args[1]?.toLowerCase() || 'mudah';

  if (!kategoriInput || !categoryMap[kategoriInput]) {
    await sock.sendMessage(remoteJid, {
      text: `📚 *TRIVIA SMA*\n\n` +
        `Ketik format: *.trivia <kategori> <level>*\n\n` +
        `*Kategori:* biologi, fisika, kimia, sejarah, geografi, inggris, indonesia\n` +
        `*Level:* mudah, sedang, sulit`
    }, { quoted: msg });
    return;
  }

  const categoryId = categoryMap[kategoriInput];
  const difficulty = difficultyMap[levelInput] || 'easy';

  await sock.sendMessage(remoteJid, { text: '🔄 *Mengambil soal dari internet...*' }, { quoted: msg });

  try {
    const apiUrl = `https://opentdb.com/api.php?amount=1&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil soal. Coba lagi!' }, { quoted: msg });
      return;
    }

    const item = data.results[0];
    const rawQuestion = decodeHTML(item.question);
    const rawAnswer = decodeHTML(item.correct_answer);

    const questionId = await translateToId(rawQuestion);
    const answerId = await translateToId(rawAnswer);

    const teks = `🧠 *TRIVIA ${kategoriInput.toUpperCase()} (${levelInput.toUpperCase()})*\n\n` +
      `*Soal:* ${questionId}\n` +
      `Waktu: *60 Detik*\n\n` +
      `_Reply pesan ini lalu jawab pakai slash!_`;

    const sentMsg = await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });

    global.db.game[remoteJid] = {
      jawaban: answerId.toLowerCase().trim(),
      jawabanAsli: rawAnswer.toLowerCase().trim(),
      timer: setTimeout(async () => {
        if (global.db.game[remoteJid]) {
          delete global.db.game[remoteJid];
          await sock.sendMessage(remoteJid, { 
            text: `lama ah kalian, yang bener: *${answerId}*` 
          }, { quoted: sentMsg });
        }
      }, 60000)
    };

  } catch (err) {
    console.error(err);
    await sock.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan server.' }, { quoted: msg });
  }
}

module.exports = triviaCommand;
