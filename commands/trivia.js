const axios = require('axios');
const config = require('../config');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

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

  // Validasi ketat pengecekan game aktif
  if (global.db.game && global.db.game[remoteJid] && global.db.game[remoteJid].type) {
    await sock.sendMessage(remoteJid, {
      text: '⚠️ Eh, selesaikan dulu kuis trivia yang lagi aktif di chat ini!'
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(remoteJid, {
    react: {
      text: '⏳',
      key: msg.key
    }
  });

  const inputKategori = (args[0] || 'umum').toLowerCase().trim();
  const inputLevel = (args[1] || 'mudah').toLowerCase().trim();

  let targetTopic = inputKategori.toUpperCase();

  let difficulty = 'mudah';
  let points = 15;
  if (['sedang', 'medium'].includes(inputLevel)) {
    difficulty = 'sedang';
    points = 30;
  } else if (['hard', 'sulit', 'susah'].includes(inputLevel)) {
    difficulty = 'sulit';
    points = 60;
  }

  try {
    const apiKey = config.groqKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      await sock.sendMessage(remoteJid, {
        text: '❌ API Key Groq belum dipasang di config.js atau .env bre!'
      }, { quoted: msg });
      return;
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const promptText = `Buatkan 1 soal trivia unik dan acak dalam Bahasa Indonesia.
Kategori: ${targetTopic}
Tingkat Kesulitan: ${difficulty}

Keluarkan hasil WAJIB dalam bentuk objek JSON valid dengan struktur persis seperti ini:
{
  "soal": "Pertanyaan di sini",
  "jawabanBenar": "Jawaban yang benar",
  "jawabanSalah": ["Salah 1", "Salah 2", "Salah 3"]
}`;

    const response = await axios.post(url, {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'Kamu adalah pembuat kuis trivia yang wajib merespon hanya dalam format JSON valid.' },
        { role: 'user', content: promptText }
      ],
      response_format: { type: "json_object" }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 20000
    });

    let resultText = response.data?.choices?.[0]?.message?.content;
    if (!resultText) throw new Error('Respon kosong dari Groq AI');

    const quizData = JSON.parse(resultText);

    if (!quizData || !quizData.soal || !quizData.jawabanBenar || !Array.isArray(quizData.jawabanSalah)) {
      throw new Error('Struktur JSON dari AI tidak lengkap');
    }

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
🎁 Hadiah Poin: *+${points} Poin*

${quizData.soal}

*Pilihan Jawaban:*
A. ${formattedOptions.a}
B. ${formattedOptions.b}
C. ${formattedOptions.c}
D. ${formattedOptions.d}

⏱️ Waktu: *${timeoutSec} Detik*

_Ketik pilihan jawaban kamu (contoh: a, b, c, atau d)_`;

    const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

    const timer = setTimeout(async () => {
      try {
        if (global.db.game && global.db.game[remoteJid] && global.db.game[remoteJid].type === 'trivia') {
          delete global.db.game[remoteJid];
          await sock.sendMessage(remoteJid, {
            text: `⏰ *Waktu abis bro!* Nggak ada yang kejawab.\nJawaban yang bener tuh: *${correctOptionLabel.toUpperCase()}. ${correctOptionText}*`
          }, { quoted: sentMsg });
        }
      } catch (e) {
        console.error('Error di timer trivia:', e);
      }
    }, timeoutSec * 1000);

    global.db.game[remoteJid] = {
      type: 'trivia',
      msgId: sentMsg.key.id,
      soal: quizData.soal,
      jawabanBenar: correctOptionLabel,
      jawabanTeks: correctOptionText.toLowerCase(),
      points: points,
      timer: timer
    };

  } catch (err) {
    if (global.db.game && global.db.game[remoteJid]) {
      delete global.db.game[remoteJid];
    }

    const errorDetails = err?.response?.data?.error?.message || err?.message || String(err);
    console.error('Error Groq Trivia Detail:', errorDetails);

    await sock.sendMessage(remoteJid, {
      text: `❌ Waduh error pas bikin soal trivia.\n_Detail: ${errorDetails}_`
    }, { quoted: msg });
  }
}

module.exports = triviaCommand;
  
