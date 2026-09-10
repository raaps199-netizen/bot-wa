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

// Fungsi acak array (Shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function translateToId(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
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

async function triviaCommand(sock, msg, args = []) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    await sock.sendMessage(remoteJid, { text: '⚠️ Masih ada game yang belum selesai di chat ini!' }, { quoted: msg });
    return;
  }

  const kategoriInput = args[0]?.toLowerCase();
  const levelInput = args[1]?.toLowerCase() || 'mudah';

  if (!kategoriInput || !categoryMap[kategoriInput]) {
    await sock.sendMessage(remoteJid, {
      text: `📚 *TRIVIA SMA*\n\n` +
        `Ketik format: *.trivia <kategori> <level>*\n\n` +
        `*Kategori:* biologi, fisika, kimia, sejarah, geografi, inggris, indonesia\n` +
        `*Level:* mudah, sedang, sulit\n\n` +
        `*Contoh:* .trivia biologi mudah`
    }, { quoted: msg });
    return;
  }

  const categoryId = categoryMap[kategoriInput];
  const difficulty = difficultyMap[levelInput] || 'easy';

  await sock.sendMessage(remoteJid, { text: '⏳' }, { quoted: msg });

  try {
    const apiUrl = `https://opentdb.com/api.php?amount=1&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil soal. Coba lagi!' }, { quoted: msg });
      return;
    }

    const item = data.results[0];
    const rawQuestion = decodeHTML(item.question);
    const rawCorrectAnswer = decodeHTML(item.correct_answer);
    const rawIncorrectAnswers = item.incorrect_answers.map(ans => decodeHTML(ans));

    // Terjemahkan soal dan opsi
    const questionId = await translateToId(rawQuestion);
    const correctId = await translateToId(rawCorrectAnswer);
    
    // Siapkan daftar opsi (1 Benar + 3-4 Salah)
    const optionsRaw = [rawCorrectAnswer, ...rawIncorrectAnswers];
    const optionsTranslated = await Promise.all(optionsRaw.map(opt => translateToId(opt)));

    // Gabungkan teks terjemahan & asli, lalu acak
    const combinedOptions = optionsTranslated.map((indo, idx) => ({
      indo: indo,
      asli: optionsRaw[idx],
      isCorrect: idx === 0
    }));

    const shuffledOptions = shuffleArray(combinedOptions);

    const labels = ['A', 'B', 'C', 'D', 'E'];
    let correctOptionLabel = '';
    let opsiText = '';

    shuffledOptions.forEach((opt, index) => {
      const label = labels[index];
      if (opt.isCorrect) correctOptionLabel = label;
      opsiText += `*${label}.* ${opt.indo}\n`;
    });

    const teks = `🧠 *TRIVIA ${kategoriInput.toUpperCase()} (${levelInput.toUpperCase()})*\n\n` +
      `*Soal:* ${questionId}\n\n` +
      `*Pilihan Jawaban:*\n${opsiText}\n` +
      `⏱️ Waktu: *60 Detik*\n` +
      `💡 _Reply/balas pesan soal ini lalu jawab pakai slash, misal: /a atau /b_`;

    const sentMsg = await sock.sendMessage(remoteJid, { text: teks }, { quoted: msg });

    global.db.game[remoteJid] = {
      msgId: sentMsg.key.id, // Menyimpan ID pesan soal untuk pengecekan reply
      jawabanOpsi: correctOptionLabel.toLowerCase(), // Misal: 'a'
      jawabanTeks: `${correctOptionLabel}. ${correctId} (${rawCorrectAnswer})`,
      timer: setTimeout(async () => {
        if (global.db.game[remoteJid]) {
          delete global.db.game[remoteJid];
          await sock.sendMessage(remoteJid, { 
            text: `⌛ *Waktu habis!*\nJawaban benar: *${correctOptionLabel}. ${correctId}*` 
          }, { quoted: sentMsg });
        }
      }, 60000)
    };

  } catch (err) {
    console.error('Error Trivia:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan server.' }, { quoted: msg });
  }
}

module.exports = triviaCommand;
