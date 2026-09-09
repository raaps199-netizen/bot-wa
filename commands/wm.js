const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function wmCommand(sock, msg, args) {
  const from = msg.key.remoteJid;
  const authorName = args.join(' ');

  const quotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

  if (!quotedSticker) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Reply stiker yang mau diganti watermark-nya!\nContoh reply stiker dengan: `.wm NamaKamu`' 
    });
  }

  if (!authorName) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Masukkan nama author-nya!\nContoh: `.wm NamaKamu`' 
    });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang mengubah watermark...' });

    const targetMsg = {
      message: msg.message.extendedTextMessage.contextInfo.quotedMessage
    };

    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

    const sticker = new Sticker(buffer, {
      pack: '', // Pack name dihilangkan sesuai request
      author: authorName, // Nama author bebas
      type: StickerTypes.FULL,
      quality: 70
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

  } catch (err) {
    console.error('Error wm:', err);
    await sock.sendMessage(from, { text: '❌ Gagal mengubah watermark stiker.' });
  }
}

module.exports = wmCommand;