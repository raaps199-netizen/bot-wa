const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

async function quoteCommand(sock, msg, args) {
  const from = msg.key.remoteJid;

  const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = contextInfo?.quotedMessage;
  const quotedParticipant = contextInfo?.participant || msg.key.participant || from;

  if (!quoted) {
    return await sock.sendMessage(from, { 
      text: '⚠️ Balas/reply pesan orang yang ingin dijadikan Quote!\nContoh: Reply chat orang lalu ketik `.quote` atau `.q`' 
    }, { quoted: msg });
  }

  try {
    await sock.sendMessage(from, { text: '⏳ Sedang membuat Quote Meme...' });

    // 1. Ambil Teks
    const textToQuote = quoted.conversation || 
                        quoted.extendedTextMessage?.text || 
                        quoted.imageMessage?.caption || 
                        quoted.videoMessage?.caption || '...';

    // 2. Ambil Foto Profil
    let avatarUrl = 'https://i.ibb.co/310n8Sz/avatar-default.png';
    try {
      avatarUrl = await sock.profilePictureUrl(quotedParticipant, 'image');
    } catch (e) {
      // Menggunakan foto profil default jika di-private
    }

    // 3. Ambil Nama Pengirim
    const name = quotedParticipant.split('@')[0];

    // 4. Kirim Permintaan ke API Quotly
    const payload = {
      type: 'quote',
      format: 'png',
      backgroundColor: '#1b1429',
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: name,
            photo: {
              url: avatarUrl
            }
          },
          text: textToQuote,
          replyMessage: {}
        }
      ]
    };

    const response = await axios.post('https://qc.botcahx.eu.org/generate', payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const imageBuffer = Buffer.from(response.data.result.image, 'base64');

    // 5. Ubah menjadi Stiker WhatsApp
    const sticker = new Sticker(imageBuffer, {
      pack: 'Quote Meme',
      author: 'Bot WA',
      type: StickerTypes.FULL,
      quality: 80
    });

    const stickerBuffer = await sticker.toBuffer();
    await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

  } catch (err) {
    console.error('Error Quote command:', err.message);
    await sock.sendMessage(from, { 
      text: '❌ Gagal membuat quote meme. Pastikan teks pesan tidak terlalu panjang atau coba lagi nanti.' 
    }, { quoted: msg });
  }
}

module.exports = quoteCommand;