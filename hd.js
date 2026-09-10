const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

async function hdCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  // Cek apakah ada gambar yang dikirim langsung atau di-reply
  const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  const isDirectImage = msg.message?.imageMessage;

  if (!isDirectImage && !isQuotedImage) {
    return await sock.sendMessage(
      remoteJid,
      { text: '❌ Kirim atau reply gambar dengan caption *.hd*' },
      { quoted: msg }
    );
  }

  try {
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    // Download media buffer
    const mediaMsg = isDirectImage 
      ? msg 
      : { message: msg.message.extendedTextMessage.contextInfo.quotedMessage };

    const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {});

    // Upload buffer sementara ke Uguu untuk mendapatkan URL gambar publik
    const FormData = require('form-data');
    const form = new FormData();
    form.append('files[]', buffer, { filename: 'image.jpg' });

    const uploadRes = await axios.post('https://uguu.se/upload.php', form, {
      headers: form.getHeaders()
    });

    const imageUrl = uploadRes.data?.files?.[0]?.url;
    if (!imageUrl) throw new Error('Gagal mengunggah gambar sementara');

    // Minta API Enhance / Remini memproses URL gambar
    const hdApiUrl = `https://api.vreden.web.id/api/remini?url=${encodeURIComponent(imageUrl)}`;
    const hdRes = await axios.get(hdApiUrl, { responseType: 'arraybuffer' });

    // Kirim hasil gambar HD ke pengguna
    await sock.sendMessage(
      remoteJid,
      {
        image: Buffer.from(hdRes.data),
        caption: '✨ *Berhasil dijernihkan!*'
      },
      { quoted: msg }
    );

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });

  } catch (err) {
    console.error('Error HD Command:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(
      remoteJid,
      { text: '❌ *Gagal!* Gambar tidak dapat dijernihkan, coba pakai gambar lain.' },
      { quoted: msg }
    );
  }
}

module.exports = hdCommand;
