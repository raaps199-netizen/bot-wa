const axios = require('axios');

async function igCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  const url = args[0];

  if (!url) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Masukkan link Instagram!\nContoh: `.ig https://www.instagram.com/reel/xxxx/`' 
    });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang mengunduh media dari Instagram...' });

    // Memanggil API Downloader Instagram
    const res = await axios.get(`https://api.vreden.web.id/api/igdownload?url=${encodeURIComponent(url)}`);
    const data = res.data?.result?.data?.[0];

    if (!data?.url) {
      throw new Error('Media tidak ditemukan dari API.');
    }

    // Mengirim video/foto sesuai link yang didapat
    await sock.sendMessage(from, { 
      video: { url: data.url }, 
      caption: '✅ Berhasil diunduh dari Instagram!' 
    }, { quoted: msg });

  } catch (err) {
    console.error('Error IG Downloader:', err);
    await sock.sendMessage(from, { text: '❌ Gagal mengunduh media Instagram. Pastikan akun tidak di-private dan link valid!' });
  }
}

module.exports = igCommand;