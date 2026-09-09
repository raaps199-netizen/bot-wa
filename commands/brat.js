const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function bratCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  const text = args.join(' ');

  if (!text) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Masukkan teksnya!\nContoh: `.brat aku sayang kamuu`' 
    });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang membuat stiker Brat...' });

    // Mengambil gambar dari API Brat
    const bratUrl = `https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(text)}`;

    const sticker = new Sticker(bratUrl, {
      pack: '', // Pack name dihilangkan
      author: 'Bot WA',
      type: StickerTypes.FULL,
      quality: 70
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

  } catch (err) {
    console.error('Error brat:', err);
    await sock.sendMessage(from, { text: '❌ Gagal membuat stiker Brat.' });
  }
}

module.exports = bratCommand;