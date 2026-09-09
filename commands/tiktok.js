const axios = require('axios');

async function tiktokCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  
  let url = args[0];
  const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                     msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

  if (!url && quotedText) {
    const match = quotedText.match(/https?:\/\/[^\s]+/);
    if (match) url = match[0];
  }

  if (!url || !url.includes('tiktok.com')) {
    return await sock.sendMessage(from, { text: '⚠️ Sertakan/reply link TikTok yang valid!\nContoh: .tt <link_tiktok>' });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang mengunduh video TikTok...' });

    const response = await axios.post('https://www.tikwm.com/api/', { url: url });
    const data = response.data?.data;

    if (!data || !data.play) {
      return await sock.sendMessage(from, { text: '❌ Gagal mengambil video.' });
    }

    await sock.sendMessage(from, {
      video: { url: data.play },
      caption: `🎥 *${data.title || 'TikTok Video'}*`
    }, { quoted: msg });

  } catch (err) {
    console.error('Error tiktok:', err);
    await sock.sendMessage(from, { text: '❌ Terjadi kesalahan saat mengunduh.' });
  }
}

module.exports = tiktokCommand;