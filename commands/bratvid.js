const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function bratvidCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  const text = args.join(' ');

  if (!text) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Masukkan teksnya!\nContoh: `.bratvid aku sayang kamu`' 
    });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang membuat stiker Brat Video...' });

    // Endpoint API khusus GIF/Video Brat
    const bratVidUrl = `https://aqul-brat.hf.space/api/brat/animate?text=${encodeURIComponent(text)}`;

    const sticker = new Sticker(bratVidUrl, {
      pack: '',
      author: 'Bot WA',
      type: StickerTypes.FULL,
      quality: 50,
      animated: true // Paksa format stiker bergerak
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

  } catch (err) {
    console.error('Error bratvid:', err);
    await sock.sendMessage(from, { text: '❌ Gagal membuat stiker Brat Video. Coba teks yang lebih pendek!' });
  }
}

module.exports = bratvidCommand;