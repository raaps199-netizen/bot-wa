const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function rvoCommand(sock, msg) {
  const from = msg.key.remoteJid;

  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quotedMsg = contextInfo?.quotedMessage;

  if (!quotedMsg) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Balas/reply pesan foto atau video 1x lihat (View Once) yang mau diambil!' 
    }, { quoted: msg });
  }

  // Deteksi media View Once
  const viewOnceMedia = quotedMsg.viewOnceMessageV2?.message || 
                        quotedMsg.viewOnceMessage?.message || 
                        quotedMsg.viewOnceMessageV2Extension?.message ||
                        (quotedMsg.imageMessage?.viewOnce ? quotedMsg : null) ||
                        (quotedMsg.videoMessage?.viewOnce ? quotedMsg : null);

  if (!viewOnceMedia) {
    return await sock.sendMessage(from, { 
      text: '❌ Pesan yang kamu reply bukan media 1x lihat (View Once)!' 
    }, { quoted: msg });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang mengambil media View Once...' });

    const targetMsg = { message: viewOnceMedia };
    const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

    const isImage = viewOnceMedia.imageMessage;
    const isVideo = viewOnceMedia.videoMessage;
    const caption = (isImage?.caption || isVideo?.caption) || '';

    if (isImage) {
      await sock.sendMessage(from, { 
        image: buffer, 
        caption: `🔓 *View Once Image Saved*\n${caption}` 
      }, { quoted: msg });
    } else if (isVideo) {
      await sock.sendMessage(from, { 
        video: buffer, 
        caption: `🔓 *View Once Video Saved*\n${caption}` 
      }, { quoted: msg });
    }

  } catch (err) {
    console.error('Error RVO Command:', err);
    await sock.sendMessage(from, { text: '❌ Gagal mengambil media 1x lihat.' }, { quoted: msg });
  }
}

module.exports = rvoCommand;