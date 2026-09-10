const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

async function hdCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  
  const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const isDirectImage = msg.message?.imageMessage;

  if (!isDirectImage && !isQuotedImage) {
    return await sock.sendMessage(remoteJid, { text: '❌ Kirim atau reply gambar dengan caption *.hd*' }, { quoted: msg });
  }

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    const mediaMsg = isDirectImage 
      ? msg 
      : { message: msg.message.extendedTextMessage.contextInfo.quotedMessage };

    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {});

    // Upload sementara ke Uguu untuk dapat URL
    const form = new FormData();
    form.append('files[]', buffer, { filename: 'image.jpg' });

    const uploadRes = await axios.post('https://uguu.se/upload.php', form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadRes.data?.files?.[0]?.url;
    if (!imageUrl) throw new Error('Gagal upload gambar sementara');

    // Panggil API HD / Remini
    const hdRes = await axios.get(`https://api.vreden.web.id/api/remini?url=${encodeURIComponent(imageUrl)}`, {
      responseType: 'arraybuffer'
    });

    await sock.sendMessage(remoteJid, {
      image: Buffer.from(hdRes.data),
      caption: '✨ *Berhasil dijernihkan!*'
    }, { quoted: msg });

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error HD:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Gambar gagal dijernihkan.' }, { quoted: msg });
  }
}

module.exports = hdCommand;
