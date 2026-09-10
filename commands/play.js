const axios = require('axios');

async function playCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const query = args.join(' ');

  if (!query) {
    return await sock.sendMessage(remoteJid, { text: '❌ Masukkan judul lagu! Contoh: *.play dj komang*' }, { quoted: msg });
  }

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const res = await axios.get(`https://api.vreden.web.id/api/ytplay?query=${encodeURIComponent(query)}`);
    const result = res.data?.result;

    if (!result || !result.download?.url) throw new Error('Musik tidak ditemukan');

    // Kirim Audio MP3
    await sock.sendMessage(remoteJid, {
      audio: { url: result.download.url },
      mimetype: 'audio/mp4',
      fileName: `${result.title || 'audio'}.mp3`
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error Play:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Tidak dapat mengunduh lagu.' }, { quoted: msg });
  }
}

module.exports = playCommand;
