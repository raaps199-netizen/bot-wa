const axios = require('axios');
const { activeGames } = require('../handlers/gameHandler');

async function triviaCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  if (activeGames.trivia?.has(remoteJid)) {
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada sesi Trivia yang berlangsung! Jawab dengan *.jawab <opsi/jawaban>*</opsi>'
    }, { quoted: msg });
    return;
  }

  try {
    // Mengambil soal acak dari API Trivia
    const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const qData = res.data.results[0];

    // Decode HTML entities
    const decodeHTMLEntities = (text) => {
      return text
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&deg;/g, '°');
    };

    const question = decodeHTMLEntities(qData.question);
    const correctAnswer = decodeHTMLEntities(qData.correct_answer);
    const incorrectAnswers = qData.incorrect_answers.map(decodeHTMLEntities);

    // Acak pilihan jawaban
    const options = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);
    const labels = ['A', 'B', 'C', 'D'];
    
    let optionsText = '';
    let correctLabel = '';

    options.forEach((opt, idx) => {
      optionsText += `\n*${labels[idx]}.* ${opt}`;
      if (opt === correctAnswer) {
        correctLabel = labels[idx];
      }
    });

    // Inisialisasi map jika belum ada
    if (!activeGames.trivia) activeGames.trivia = new Map();

    const timeout = setTimeout(async () => {
      if (activeGames.trivia.has(remoteJid)) {
        activeGames.trivia.delete(remoteJid);
        await sock.sendMessage(remoteJid, {
          text: `⏱️ *Waktu Habis!*\nJawaban yang benar adalah: *${correctLabel}. ${correctAnswer}*`
        });
      }
    }, 60000);

    // Simpan kunci jawaban (bisa huruf A/B/C/D atau teks jawabannya)
    activeGames.trivia.set(remoteJid, {
      answer: correctLabel,
      fullAnswer: correctAnswer,
      timeout: timeout
    });

    const caption = `
🧠 *TRIVIA GAME*
Kategori: *${qData.category}* | Tingkat: *${qData.difficulty}*

*Pertanyaan:*
${question}

*Pilihan Jawaban:*${optionsText}

⏱️ Waktu: *60 detik*
Ketik *.jawab <A/B/C/D>* untuk menjawab!
`.trim();

    await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

  } catch (err) {
    console.error('Error Trivia API:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil soal trivia dari server, coba lagi nanti.' }, { quoted: msg });
  }
}

module.exports = triviaCommand;
