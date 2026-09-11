const Groq = require('groq-sdk');
const config = require('../config'); // Pastikan config punya API key groq atau sesuaikan

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || config.groqApiKey });

async function triviaCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  if (global.db?.game?.[remoteJid]) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masih ada game aktif di chat ini! Selesaikan dulu atau ketik *.nyerah*.'
    }, { quoted: msg });
  }

  const kategori = args[0] || 'umum';
  const level = args[1] || 'mudah';

  await sock.sendMessage(remoteJid, { text: '⏳ Sedang meracik soal trivia...' }, { quoted: msg });

  try {
    const prompt = `Buatkan 1 soal trivia ${kategori} dengan tingkat kesulitan ${level} dalam format JSON murni (tanpa markdown backticks).
Struktur JSON harus seperti ini:
{
  "soal": "Pertanyaan trivia...",
  "pilihan": {
    "a": "Opsi A",
    "b": "Opsi B",
    "c": "Opsi C",
    "d": "Opsi D"
  },
  "jawaban": "a" (hanya huruf a, b, c, atau d yang merupakan jawaban benar)
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    const data = JSON.parse(responseText);

    if (!data.soal || !data.pilihan || !data.jawaban) {
      throw new Error('Format dari AI tidak valid');
    }

    const kunciJawaban = data.jawaban.toLowerCase().trim(); // contoh: 'b'
    const teksJawabanLengkap = data.pilihan[kunciJawaban]; // contoh: 'Ampere'

    const points = level.toLowerCase() === 'hard' || level.toLowerCase() === 'sulit' ? 50 : level.toLowerCase() === 'sedang' ? 30 : 15;

    const caption = 
`❓ *TRIVIA (${kategori.toUpperCase()} - ${level.toUpperCase()})*

${data.soal}

*Pilihan Jawaban:*
a. ${data.pilihan.a}
b. ${data.pilihan.b}
c. ${data.pilihan.c}
d. ${data.pilihan.d}

⏱️ Waktu: *60 Detik*
_Ketik huruf pilihan kamu (a, b, c, atau d) di chat!_`;

    const sentMsg = await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });

    const timer = setTimeout(async () => {
      if (global.db.game[remoteJid]) {
        delete global.db.game[remoteJid];
        await sock.sendMessage(remoteJid, {
          text: `⏳ *Waktu habis!*\nJawaban yang benar adalah: *${kunciJawaban.toUpperCase()}. ${teksJawabanLengkap}*`
        }, { quoted: sentMsg });
      }
    }, 60000);

    // Simpan sesi dengan fleksibel agar gameHandler bisa membaca huruf pilihan ATAU teks lengkapnya
    global.db.game[remoteJid] = {
      type: 'trivia',
      msgId: sentMsg.key.id,
      jawabanBenar: kunciJawaban, // Menyimpan huruf 'a', 'b', 'c', atau 'd'
      jawabanTeks: teksJawabanLengkap.toLowerCase(), // Menyimpan teks opsi juga untuk antisipasi
      points: points,
      timer: timer
    };

  } catch (err) {
    console.error('Error trivia:', err);
    await sock.sendMessage(remoteJid, { text: '❌ Gagal membuat soal trivia. Coba lagi nanti!' }, { quoted: msg });
  }
}

module.exports = triviaCommand;
