const axios = require('axios');
const config = require('../config');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

/**
 * Helper acak pilihan jawaban
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function triviaCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  // Cek jika ada game yang sedang berjalan
  if (global.db.game[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada kuis yang belum selesai di chat ini!'
    }, { quoted: msg });
  }

  const inputKategori = (args[0] || 'umum').toLowerCase().trim();
  const inputLevel = (args[1] || 'mudah').toLowerCase().trim();

  // Pemetaan Kategori
  let targetTopic = 'UMUM';
  if (['sejarah', 'history', 'sej'].includes(inputKategori)) targetTopic = 'SEJARAH';
  else if (['geografi', 'geo', 'geography'].includes(inputKategori)) targetTopic = 'GEOGRAFI';
  else if (['matematika', 'math'].includes(inputKategori)) targetTopic = 'MATEMATIKA';
  else if (['komputer', 'tech', 'teknologi'].includes(inputKategori)) targetTopic = 'KOMPUTER & TEKNOLOGI';
  else if (['sains', 'science', 'ipa'].includes(inputKategori)) targetTopic = 'SAINS';
  else if (['otomotif', 'auto', 'mobil', 'motor'].includes(inputKategori)) targetTopic = 'OTOMOTIF';
  else if (['kimia'].includes(inputKategori)) targetTopic = 'KIMIA';
  else if (['fisika'].includes(inputKategori)) targetTopic = 'FISIKA';
  else if (['biologi', 'bio'].includes(inputKategori)) targetTopic = 'BIOLOGI';

  let difficulty = 'mudah';
  if (['sedang', 'medium'].includes(inputLevel)) difficulty = 'sedang';
  else if (['hard', 'sulit', 'susah'].includes(inputLevel)) difficulty = 'sulit';

  const loadingMsg = await sock.sendMessage(remoteJid, { text: '⏳ *Sedang membuat soal trivia...*' }, { quoted: msg });

  try {
    const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ API Key Gemini belum dipasang di config.js!'
      }, { quoted: msg });
    }

    const url = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){apiKey}`;

    const promptText = `Buatkan 1 soal trivia unik dan acak dalam Bahasa Indonesia.
Kategori: ${targetTopic}
Tingkat Kesulitan: ${difficulty}

Respons WAJIB dalam format JSON murni tanpa markdown/backticks, contoh format:
{
  "soal": "Pertanyaan di sini",
  "jawabanBenar": "Jawaban yang benar",
  "jawabanSalah": ["Salah 1", "Salah 2", "Salah 3"]
}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    }, { timeout: 15000 });

    let resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error('Respon kosong dari AI Gemini');

    // Sanitasi String JSON dari kemungkinan karakter markdown
    resultText = resultText.replace(/```json|```/g, '').trim();
    const quizData = JSON.parse(resultText);

    if (!quizData || !quizData.soal || !quizData.jawabanBenar || !Array.isArray(quizData.jawabanSalah)) {
      throw new Error('Format JSON dari AI tidak valid atau tidak lengkap');
    }

    // Acak Opsi Pilihan (A, B, C, D)
    const optionsRaw = [
      { isCorrect: true, text: quizData.jawabanBenar },
      ...quizData.jawabanSalah.map(ans => ({ isCorrect: false, text: ans }))
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
`❓ *TRIVIA (${targetTopic} - ${difficulty.toUpperCase()})*

${quizData.soal}

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

    // Simpan Sesi Game ke Memory
    global.db.game[remoteJid] = {
      type: 'trivia',
      msgId: sentMsg.key.id,
      soal: quizData.soal,
      jawabanOpsi: correctOptionLabel,
      jawabanTeks: `${correctOptionLabel.toUpperCase()}. ${correctOptionText}`,
      jawabanBenar: quizData.jawabanBenar,
      timer: timer
    };

  } catch (err) {
    // 💡 SANGAT PENTING: Hapus dari db.game jika timbul error agar tidak mengganggu fitur lain (.ai)
    if (global.db.game[remoteJid]) {
      delete global.db.game[remoteJid];
    }

    if (err?.response?.data) {
      console.error('Error Trivia Gemini API Response:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Trivia Gemini AI:', err.message || err);
    }

    await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat membuat soal trivia. Silakan coba lagi!'
    }, { quoted: msg });
  }
}

module.exports = triviaCommand;
