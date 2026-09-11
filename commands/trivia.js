const axios = require('axios');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

/**
 * Helper Translate menggunakan Google Translate API (Gratis)
 */
async function translateToId(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    return res.data[0].map(item => item[0]).join('');
  } catch (err) {
    return text; // Jika gagal translate, kirim teks asli
  }
}

/**
 * Helper untuk mengacak urutan pilihan jawaban
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function triviaCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  // Cek jika sedang ada game berjalan
  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada kuis yang belum selesai di chat ini!'
    }, { quoted: msg });
  }

  const inputLevel = (args[1] || 'mudah').toLowerCase().trim();
  let difficulty = 'easy';
  if (['sedang', 'medium'].includes(inputLevel)) difficulty = 'medium';
  else if (['hard', 'sulit', 'susah'].includes(inputLevel)) difficulty = 'hard';

  // Kirim notifikasi loading
  await sock.sendMessage(remoteJid, { 
    text: '🔄 *Mengambil soal terbaru dari internet...*' 
  }, { quoted: msg });

  try {
    // Ambil soal dari OpenTDB (Category 17 = Science & Nature)
    const apiUrl = `https://opentdb.com/api.php?amount=1&category=17&difficulty=${difficulty}&type=multiple`;
    const response = await axios.get(apiUrl);

    if (!response.data.results || response.data.results.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ Gagal mengambil soal dari internet. Coba beberapa saat lagi!'
      }, { quoted: msg });
    }

    const quizData = response.data.results[0];

    // Bersihkan entitas HTML
    const cleanQuestion = quizData.question
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&');

    // Translate ke Bahasa Indonesia
    const translatedQuestion = await translateToId(cleanQuestion);
    const translatedCorrect = await translateToId(quizData.correct_answer);
    const translatedIncorrect = await Promise.all(
      quizData.incorrect_answers.map(async (ans) => await translateToId(ans))
    );

    // Acak Opsi Jawaban
    const optionsRaw = [
      { isCorrect: true, text: translatedCorrect },
      ...translatedIncorrect.map(ans => ({ isCorrect: false, text: ans }))
    ];

    const shuffledOptions = shuffleArray(optionsRaw);
    const labels = ['a', 'b', 'c', 'd'];

    let correctOptionLabel = '';
    let correctOptionText = '';
    const formattedOptions = {};

    shuffledOptions.forEach((opt, index) => {
      const label = labels[index];
      formattedOptions[label] = opt.text;
      if (opt.isCorrect) {
        correctOptionLabel = label;
        correctOptionText = opt.text;
      }
    });

    const timeoutSec = 60;

    const caption = 
`❓ *TRIVIA SAINS ONLINE (${difficulty.toUpperCase()})*

${translatedQuestion}

*Pilihan Jawaban:*
A. ${formattedOptions.a}
B. ${formattedOptions.b}
C. ${formattedOptions.c}
D. ${formattedOptions.d}

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik pilihan jawaban kamu (contoh: a, b, c, atau d)_`;

    const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

    // Set Timer Penjawab
    const timer = setTimeout(async () => {
      if (global.db.game[remoteJid]) {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, {
          text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${correctOptionLabel.toUpperCase()}. ${correctOptionText}*`
        }, { quoted: sentMsg });
      }
    }, timeoutSec * 1000);

    // Simpan Sesi
    global.db.game[remoteJid] = {
      msgId: sentMsg.key.id,
      jawabanOpsi: correctOptionLabel,
      jawabanTeks: `${correctOptionLabel.toUpperCase()}. ${correctOptionText}`,
      timer: timer
    };

  } catch (err) {
    console.error('Error Trivia API:', err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat mengambil soal trivia dari internet.'
    }, { quoted: msg });
  }
}

module.exports = triviaCommand;
