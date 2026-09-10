const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFileSync, unlinkSync, existsSync, mkdirSync } = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function tovidCommand(sock, msg) {
  const remoteJid = msg.key.remoteJid;

  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMessage = quoted?.stickerMessage || msg.message?.stickerMessage;

    if (!stickerMessage) {
      await sock.sendMessage(remoteJid, { text: '⚠️ *Reply stiker bergerak (GIF/Video)* untuk diubah menjadi video!' }, { quoted: msg });
      return;
    }

    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });

    // Download stiker
    const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
    let buffer = Buffer.alloc(0);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const tmpDir = path.join(__dirname, '../tmp');
    if (!existsSync(tmpDir)) mkdirSync(tmpDir);

    const inputPath = path.join(tmpDir, `stk_${Date.now()}.webp`);
    const outputPath = path.join(tmpDir, `vid_${Date.now()}.mp4`);

    writeFileSync(inputPath, buffer);

    // Konversi WebP ke MP4 memakai ffmpeg
    exec(`ffmpeg -i "${inputPath}" -vf "crop=trunc(iw/2)*2:trunc(ih/2)*2" -ss 00:00:00 -pix_fmt yuv420p -c:v libx264 -profile:v baseline -level 3.0 -preset ultrafast "${outputPath}"`, async (err) => {
      if (existsSync(inputPath)) unlinkSync(inputPath);

      if (err) {
        console.error('Error FFmpeg tovid:', err);
        await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
        await sock.sendMessage(remoteJid, { text: '❌ *Gagal mengkonversi stiker ke video!*' }, { quoted: msg });
        return;
      }

      await sock.sendMessage(remoteJid, {
        video: { url: outputPath },
        caption: '✅ *Berhasil diubah ke Video!*'
      }, { quoted: msg });

      await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
      if (existsSync(outputPath)) unlinkSync(outputPath);
    });

  } catch (err) {
    console.error('Error tovid:', err);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
    await sock.sendMessage(remoteJid, { text: '❌ *Terjadi kesalahan sistem.*' }, { quoted: msg });
  }
}

module.exports = tovidCommand;
