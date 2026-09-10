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
    // Indikator loading simpel dengan emoji
    await sock.sendMessage(from, { text: '⏳' }, { quoted: msg });

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
      // Menggunakan foto profil default jika di-private/gagal ambil
    }

    // 3. Ambil Nama Pengirim (Gunakan pushName jika pesan sendiri/terdeteksi, atau sock.getName)
    let senderName = 'Pengguna WhatsApp';
    try {
      if (sock.getName) {
        senderName = await sock.getName(quotedParticipant);
      } else {
        senderName = msg.pushName || quotedParticipant.split('@')[0];
      }
    } catch (e) {
      senderName = quotedParticipant.split('@')[0];
    }

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
            name: senderName, // Nama pengirim yang sudah didapatkan
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

    if (!response.data?.result?.image) {
      throw new Error('Respon dari server Quotly tidak valid');
    }

    const imageBuffer = Buffer.from(response.data.result.image, 'base64');

    // 5. Ubah menjadi Stiker WhatsApp
    const sticker = new Sticker(imageBuffer, {
      pack: 'Quote Meme',
      author: senderName, // Author stiker otomatis memakai nama pengirim
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
