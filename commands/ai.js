const axios = require('axios');
const config = require('../config');

async function aiCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const textPrompt = args.join(' ').trim();

  if (!textPrompt) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Silakan masukkan pertanyaan/perintah!\n\n*Contoh:* `.ai Siapa presiden pertama Indonesia?`'
    }, { quoted: msg });
  }

  try {
    const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ API Key Gemini belum dipasang di config.js!'
      }, { quoted: msg });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: textPrompt }]
      }]
    }, { timeout: 15000 });

    const replyText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Respon AI kosong');
    }

    await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg });

  } catch (err) {
    console.error('Error Command AI:', err?.response?.data || err.message || err);
    await sock.sendMessage(remoteJid, {
      text: '❌ Terjadi kesalahan saat memproses permintaan AI.'
    }, { quoted: msg });
  }
}

module.exports = aiCommand;
