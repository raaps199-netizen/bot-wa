const axios = require('axios');
const config = require('../config');

async function aiCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const userQuery = args.join(' ').trim();

  if (!userQuery) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masukkan pertanyaan kamu!\nContoh: `.ai kenapa langit berwarna biru?`'
    }, { quoted: msg });
  }

  const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return await sock.sendMessage(remoteJid, {
      text: '❌ API Key Gemini belum dipasang di config.js!'
    }, { quoted: msg });
  }

  // Cek apakah user me-reply pesan
  const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';

  let finalPrompt = userQuery;

  // Jika yang di-reply adalah pesan berisi teks (seperti soal/jawaban trivia)
  if (quotedText) {
    finalPrompt = `Berikut adalah konteks pesan yang di-reply oleh pengguna:\n"${quotedText}"\n\nPertanyaan pengguna: ${userQuery}\n\nJelaskan dan jawablah pertanyaan pengguna berdasarkan konteks di atas secara singkat, jelas, dan ramah dalam Bahasa Indonesia.`;
  }

  await sock.sendMessage(remoteJid, { text: '...' }, { quoted: msg });

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: finalPrompt }]
      }]
    }, { timeout: 15000 });

    const aiReply = response.data.candidates[0].content.parts[0].text;

    await sock.sendMessage(remoteJid, {
      text: aiReply
    }, { quoted: msg });

  } catch (err) {
    console.error('Error AI Command:', err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat memproses jawaban dari AI.'
    }, { quoted: msg });
  }
}

module.exports = aiCommand;
