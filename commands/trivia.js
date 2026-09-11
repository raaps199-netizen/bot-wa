const axios = require('axios');

if (!global.db) global.db = {};
if (!global.db.game) global.db.game = {};

/**
 * Helper acak pilihan jawaban
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

  await sock.sendMessage(remoteJid, { text: '...' }, { quoted: msg });

  try {
    const promptText = `Buatkan 1 soal trivia unik, acak, dan belum pernah ada sebelumnya.
Kategori: ${targetTopic}
Tingkat Kesulitan: ${difficulty}

SANGAT PENTING: Kembalikan respon HANYA berupa JSON murni tanpa format markdown/backticks/penjelasan tambahan.
Contoh format wajib:
{"soal":"Pertanyaan","jawabanBenar":"Benar","jawabanSalah":["Salah1","Salah2","Salah3"]}`;

    // Memanggil API AI Publik Gratisan (Tanpa API Key & Tanpa Terminal)
    const res = await axios.post('https://text.pollinations.ai/', {
      messages: [
        { role: 'user', content: promptText }
      ],
      jsonMode: true
    }, { timeout: 15000 });

    let rawText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    
    // Clean string jika AI memberikan format markdown
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const quizData = JSON.parse(rawText);

    if (!quizData || !quizData.soal || !quizData.jawabanBenar || !quizData.jawabanSalah) {
      throw new Error('Format JSON dari AI tidak valid');
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

    // Simpan Sesi Game
    global.db.game[remoteJid] = {
      msgId: sentMsg.key.id,
      jawabanOpsi: correctOptionLabel,
      jawabanTeks: `${correctOptionLabel.toUpperCase()}. ${correctOptionText}`,
      timer: timer
    };

  } catch (err) {
    console.error('Error Trivia AI:', err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat meracik soal trivia baru.'
    }, { quoted: msg });
  }
}

module.exports = triviaCommand;
