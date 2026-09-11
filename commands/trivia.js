const axios = require('axios');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

/**
 * Helper Translate ke Bahasa Indonesia (Google Translate API)
 */
async function translateToId(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    return res.data[0].map(item => item[0]).join('');
  } catch (err) {
    return text;
  }
}

/**
 * Helper acak pilihan
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Decode Karakter HTML Spesial
 */
function decodeHTML(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function triviaCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada kuis yang belum selesai di chat ini!'
    }, { quoted: msg });
  }

  const inputKategori = (args[0] || '').toLowerCase().trim();
  const inputLevel = (args[1] || 'mudah').toLowerCase().trim();

  // Pemetaan Kategori ke Category ID OpenTDB
  let categoryId = 17; // Default: Science & Nature
  let targetTopic = inputKategori || 'SAINS';

  if (['sejarah', 'history', 'sej'].includes(inputKategori)) {
    categoryId = 23; // OpenTDB Category ID 23 = History
    targetTopic = 'SEJARAH';
  } else if (['geografi', 'geo', 'geography'].includes(inputKategori)) {
    categoryId = 22; // OpenTDB Category ID 22 = Geography
    targetTopic = 'GEOGRAFI';
  } else if (['matematika', 'math'].includes(inputKategori)) {
    categoryId = 19;
    targetTopic = 'MATEMATIKA';
  } else if (['komputer', 'tech'].includes(inputKategori)) {
    categoryId = 18;
    targetTopic = 'KOMPUTER';
  }

  let difficulty = 'easy';
  if (['sedang', 'medium'].includes(inputLevel)) difficulty = 'medium';
  else if (['hard', 'sulit', 'susah'].includes(inputLevel)) difficulty = 'hard';

  await sock.sendMessage(remoteJid, { 
    text: `...` 
  }, { quoted: msg });

  try {
    let quizData = null;
    let attempts = 0;

    // Filter/retry hingga 5 kali jika memilih sub-sains (kimia/fisika/biologi)
    while (attempts < 5) {
      attempts++;
      const apiUrl = `https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficulty}&type=multiple`;
      const response = await axios.get(apiUrl);

      if (response.data.results && response.data.results.length > 0) {
        const results = response.data.results;

        if (['kimia', 'chemistry'].includes(inputKategori)) {
          quizData = results.find(q => /element|chemical|acid|atom|compound|gas|reaction|molecule|periodic/i.test(q.question));
        } else if (['fisika', 'physics'].includes(inputKategori)) {
          quizData = results.find(q => /force|energy|speed|gravity|light|wave|mass|motion|joule|newton|celsius/i.test(q.question));
        } else if (['biologi', 'biology', 'bio'].includes(inputKategori)) {
          quizData = results.find(q => /cell|organ|body|plant|animal|species|dna|blood|heart/i.test(q.question));
        } else {
          quizData = results[0]; // Untuk Sejarah, Geografi, Matematika, dll.
        }

        if (quizData) break;
      }
    }

    if (!quizData) {
      return await sock.sendMessage(remoteJid, {
        text: `❌ Soal untuk kategori *${targetTopic.toUpperCase()}* tidak ditemukan. Coba ketik \`.trivia sejarah mudah\` atau \`.trivia geografi mudah\`.`
      }, { quoted: msg });
    }

    const cleanQuestion = decodeHTML(quizData.question);

    // Menerjemahkan soal dan pilihan jawaban ke Bahasa Indonesia
    const translatedQuestion = await translateToId(cleanQuestion);
    const translatedCorrect = await translateToId(decodeHTML(quizData.correct_answer));
    const translatedIncorrect = await Promise.all(
      quizData.incorrect_answers.map(async (ans) => await translateToId(decodeHTML(ans)))
    );

    // Acak Opsi Pilihan (A, B, C, D)
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
`❓ *TRIVIA (${targetTopic.toUpperCase()} - ${difficulty.toUpperCase()})*

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

    // Simpan Sesi Game
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
  
