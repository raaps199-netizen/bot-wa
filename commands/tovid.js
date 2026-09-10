const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getRandom } = require('../lib/functions'); // Asumsi kamu punya fungsi pencari nama file acak

async function tovidCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  // Cek apakah ada stiker yang di-reply
  if (!quoted || !quoted.stickerMessage) {
    return await sock.sendMessage(remoteJid, { text: '❌ Reply stiker bergerak dengan command *.tovid*' }, { quoted: msg });
  }

  // Cek apakah stiker bergerak atau tidak
  if (quoted.stickerMessage.isAnimated === false) {
    return await sock.sendMessage(remoteJid, { text: '❌ Stiker tersebut bukan stiker bergerak!' }, { quoted: msg });
  }

  try {
    // Reaksi loading
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    // Download media buffer
    const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});

    // Buat nama file acak dan simpan buffer
    const filename = getRandom('.webp');
    const outFilename = getRandom('.mp4');
    fs.writeFileSync(filename, buffer);

    // Proses convert wepb ke mp4 menggunakan FFmpeg
    // Pastikan FFmpeg sudah terinstal di server kamu
    exec(`ffmpeg -i ${filename} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p ${outFilename}`, async (err) => {
      // Hapus file sementara wepb
      if (fs.existsSync(filename)) fs.unlinkSync(filename);

      if (err) {
        console.error('FFmpeg Error:', err);
        throw new Error('Gagal mengonversi stiker ke video');
      }

      // Baca video hasil convert dan kirim ke pengguna
      const videoBuffer = fs.readFileSync(outFilename);
      await sock.sendMessage(remoteJid, { video: videoBuffer, caption: '✨ *Berhasil diubah ke video!*' }, { quoted: msg });

      // Hapus file sementara mp4
      if (fs.existsSync(outFilename)) fs.unlinkSync(outFilename);

      // Reaksi sukses
      await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
    });

  } catch (err) {
    console.error('Error Tovid:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Gagal!* Terjadi kesalahan saat memproses stiker.' }, { quoted: msg });
  }
}

module.exports = tovidCommand;
    
