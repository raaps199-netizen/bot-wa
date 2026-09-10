const axios = require('axios');

async function aiCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const textInput = args.join(' ');

  if (!textInput) {
    return await sock.sendMessage(remoteJid, { text: '❌ Masukkan pertanyaan! Contoh: .ai Siapa presiden Indonesia?' }, { quoted: msg });
  }

  try {
    // Reaksi loading
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    // Request ke API AI
    // Ganti dengan API Key kamu sendiri jika API ini mati
    const response = await axios.get(`https://api.vreden.web.id/api/ai?text=${encodeURIComponent(textInput)}`);
    const result = response.data?.result;

    if (!result) throw new Error('Respon AI kosong');

    // Kirim Jawaban
    await sock.sendMessage(remoteJid, { text: result }, { quoted: msg });

    // Reaksi sukses
    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error AI:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Terjadi kesalahan saat menghubungi server AI.' }, { quoted: msg });
  }
}

module.exports = aiCommand;
