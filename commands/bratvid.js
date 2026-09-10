const axios = require('axios');

async function bratvidCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const text = args.join(' ');

  if (!text) {
    await sock.sendMessage(remoteJid, { 
      text: '⚠️ *Harap masukkan teks!*\nContoh: `.bratvid Bot WA Keren` ' 
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

  try {
    // Menggunakan API Brat Video
    const apiUrl = `https://api.everfree.my.id/api/bratvid?text=${encodeURIComponent(text)}`;
    
    // Ambil MP4 / GIF dari API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(response.data);

    await sock.sendMessage(remoteJid, {
      video: videoBuffer,
      gifPlayback: true,
      caption: '✅ *Berhasil membuat Brat Video!*'
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error bratvid:', err?.message || err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { 
      text: '❌ *Gagal membuat Brat Video!* Server API sedang sibuk/down, silakan coba beberapa saat lagi.' 
    }, { quoted: msg });
  }
}

module.exports = bratvidCommand;
