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

  await sock.sendMessage(remoteJid, { text: '⏳ *Sedang memproses dengan Groq AI...*' }, { quoted: msg });

  try {
    const apiKey = config.groqKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return await sock.sendMessage(remoteJid, {
        text: '❌ API Key Groq belum dipasang di config.js atau .env!'
      }, { quoted: msg });
    }

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await axios.post(url, {
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'Kamu adalah asisten AI bahasa Indonesia yang membantu.' },
        { role: 'user', content: textPrompt }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 20000
    });

    const replyText = response.data?.choices?.[0]?.message?.content;
    if (!replyText) throw new Error('Respon kosong dari Groq AI.');

    await sock.sendMessage(remoteJid, { text: replyText.trim() }, { quoted: msg });

  } catch (err) {
    const errorDetails = err?.response?.data?.error?.message || err?.message || String(err);
    console.error('Error Groq AI:', errorDetails);

    await sock.sendMessage(remoteJid, {
      text: `❌ Terjadi kesalahan saat memproses permintaan AI.\n_Detail: ${errorDetails}_`
    }, { quoted: msg });
  }
}

module.exports = aiCommand;
