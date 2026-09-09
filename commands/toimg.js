const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function toimgCommand(sock, msg) {
  const from = msg.key.remoteJid;
  const quotedSticker = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

  if (!quotedSticker) {
    return await sock.sendMessage(from, { text: '⚠️ Reply stiker yang mau diubah jadi foto!' });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Mengubah stiker menjadi gambar...' });

    const targetMsg = {
      message: msg.message.extendedTextMessage.contextInfo.quotedMessage
    };

    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

    await sock.sendMessage(from, { image: buffer, caption: '✅ Berhasil diubah ke gambar!' }, { quoted: msg });
  } catch (err) {
    console.error('Error toimg:', err);
    await sock.sendMessage(from, { text: '❌ Gagal mengubah stiker ke gambar.' });
  }
}

module.exports = toimgCommand;