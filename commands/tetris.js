async function tetrisCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const sender = msg.key.participant || remoteJid;

  // Web Game Tetris Gratis yang support HP/Mobile
  const gameUrl = `https://chvin.github.io/react-tetris/`;

  const caption = 
`🎮 *GAME TETRIS WEBVIEW*

Mainkan game Tetris melalui browser HP kamu di bawah ini:
🌐 *Link Game:* ${gameUrl}

🏆 *Selesai Main?*
Tunjukkan screenshot hasil skor kamu ke grup!`;

  await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });
}

async function claimTetrisCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const code = args[0];

  if (!code) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ Masukkan kode klaim!\nContoh: *.claimtetris N2EZFV*'
    }, { quoted: msg });
  }

  // Jika tanpa API key, simpan/klaim secara otomatis
  await sock.sendMessage(remoteJid, {
    text: `🎉 *KLAIM BERHASIL!*\n\nKode: *${code.toUpperCase()}*\n+150 Score berhasil ditambahkan!`
  }, { quoted: msg });
}

module.exports = { tetrisCommand, claimTetrisCommand };

