const axios = require('axios');

async function playCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const query = args.join(' ');

  if (!query) {
    await sock.sendMessage(remoteJid, { 
      text: '⚠️ *Masukkan judul lagu!*\nContoh: `.play komang raim laode` ' 
    }, { quoted: msg });
    return;
  }

  await sock.sendMessage(remoteJid, { react: { text: '🔍', key: msg.key } });

  try {
    // Menggunakan API Downloader YouTube
    const searchUrl = `https://api.vreden.web.id/api/ytplay?query=${encodeURIComponent(query)}`;
    const res = await axios.get(searchUrl);

    if (!res.data || !res.data.result) {
      throw new Error('Lagu tidak ditemukan.');
    }

    const data = res.data.result;
    const audioUrl = data.download?.url || data.url;
    const title = data.title || query;

    await sock.sendMessage(remoteJid, { react: { text: '📥', key: msg.key } });

    // Kirim Audio
    await sock.sendMessage(remoteJid, {
      audio: { url: audioUrl },
      mimetype: 'audio/mp4',
      ptt: false
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error playCommand:', err?.message || err);
    
    // Fallback API jika API pertama gagal
    try {
      const fallbackUrl = `https://api.everfree.my.id/api/ytplay?query=${encodeURIComponent(query)}`;
      const resFallback = await axios.get(fallbackUrl);
      const dataFb = resFallback.data?.result;

      if (dataFb && dataFb.audio) {
        await sock.sendMessage(remoteJid, {
          audio: { url: dataFb.audio },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: msg });
        
        await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
        return;
      }
    } catch (fbErr) {
      console.error('Error Fallback play:', fbErr?.message);
    }

    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { 
      text: '❌ *Gagal mengunduh lagu!* Server pencari lagu sedang mengalami gangguan, silakan coba beberapa saat lagi.' 
    }, { quoted: msg });
  }
}

module.exports = playCommand;
