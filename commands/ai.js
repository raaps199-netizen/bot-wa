const axios = require('axios');
const config = require('../config');

async function aiCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const textPrompt = args.join(' ').trim();

  if (!textPrompt) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Silakan masukkan pertanyaan atau perintah!\n\n*Contoh:* `.ai Siapa presiden pertama Indonesia?`'
    }, { quoted: msg });
  }

  await sock.sendMessage(remoteJid, { text: '⏳ *Sedang memproses...*' }, { quoted: msg });

  try {
    const apiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ API Key Gemini belum dipasang di config.js atau .env!'
      }, { quoted: msg });
    }

    // URL Bersih tanpa parameter ?key=
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: textPrompt }]
      }]
    }, { 
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey 
      },
      timeout: 20000 
    });

    let replyText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('Respon AI kosong dari Gemini.');
    }

    await sock.sendMessage(remoteJid, { text: replyText.trim() }, { quoted: msg });

  } catch (err) {
    const errorDetails = err?.response?.data?.error?.message || err?.message || String(err);
    console.error('Error Command AI Detail:', errorDetails);

    await sock.sendMessage(remoteJid, {
      text: `❌ Terjadi kesalahan saat memproses permintaan AI.\n_Detail: ${errorDetails}_`
    }, { quoted: msg });
  }
}

module.exports = aiCommand;
