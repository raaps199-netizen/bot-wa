const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function stickerCommand(sock, msg) {
  const from = msg.key.remoteJid;
  
  const isImage = msg.message?.imageMessage;
  const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

  if (!isImage && !isQuotedImage) {
    return await sock.sendMessage(from, { text: '⚠️ Kirim foto dengan caption .s atau reply foto dengan .s!' });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Utiwi dibuat rek...' });

    let targetMsg = msg;
    if (isQuotedImage) {
      targetMsg = {
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage
      };
    }

    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

    const sticker = new Sticker(buffer, {
      pack: 'Bot Sticker',
      author: 'Bot WA',
      type: StickerTypes.FULL,
      quality: 70
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });
  } catch (err) {
    console.error('Error sticker:', err);
    await sock.sendMessage(from, { text: '❌ Lho gabisa cuy.' });
  }
}

module.exports = stickerCommand;