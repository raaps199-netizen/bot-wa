const axios = require('axios');

async function ytmp3Command(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const url = args[0];

  if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
    return await sock.sendMessage(remoteJid, { text: '❌ Masukkan URL YouTube! Contoh: *.ytmp3 https://youtu.be/xxxx*' }, { quoted: msg });
  }

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const res = await axios.get(`https://api.vreden.web.id/api/ytmp3?url=${encodeURIComponent(url)}`);
    const result = res.data?.result;

    if (!result || !result.download?.url) throw new Error('Download URL gagal');

    await sock.sendMessage(remoteJid, {
      audio: { url: result.download.url },
      mimetype: 'audio/mp4',
      fileName: `${result.title || 'youtube'}.mp3`
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error YTmp3:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Gagal mengunduh audio dari link tersebut.' }, { quoted: msg });
  }
}

module.exports = ytmp3Command;
