// Inisialisasi Database Sederhana untuk Menyimpan Skor & Kode Klaim
if (!global.db) global.db = {};
if (!global.db.users) global.db.users = {};

/**
 * Command untuk menampilkan link game Tetris
 */
async function tetrisCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;

  // Link Webview Game Tetris (Bisa dimainkan di browser HP)
  const gameUrl = `https://chvin.github.io/react-tetris/`;

  const caption = 
`🎮 *GAME TETRIS WEBVIEW*

Mainkan game Tetris melalui browser HP kamu di link berikut:
🌐 *Link Game:* ${gameUrl}

🏆 *CARA KLAIM SKOR:*
1. Mainkan game hingga selesai (*Game Over*).
2. Dapatkan kode unik klaim hasil main kamu.
3. Kirimkan kode tersebut ke chat ini.

📌 *Contoh Klaim:*
\`.claimtetris N2EZFV\``;

  await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });
}

/**
 * Command untuk menukarkan kode unik skor Tetris (.claimtetris <code>)
 */
async function claimTetrisCommand(sock, msg, args) {
  const remoteJid = msg.key.remoteJid;
  const sender = msg.key.participant || remoteJid;
  const code = args[0];

  // 1. Pengecekan Input Kode
  if (!code) {
    return await sock.sendMessage(remoteJid, {
      text: '⚠️ *Masukkan kode klaim kamu!*\n\nContoh:\n*.claimtetris N2EZFV*'
    }, { quoted: msg });
  }

  const formattedCode = code.toUpperCase().trim();

  // Validasi panjang kode (minimal 4 karakter)
  if (formattedCode.length < 4) {
    return await sock.sendMessage(remoteJid, {
      text: '❌ Kode klaim tidak valid! Pastikan kode yang dimasukkan benar.'
    }, { quoted: msg });
  }

  // 2. Inisialisasi Data Pemain di Database
  if (!global.db.users[sender]) {
    global.db.users[sender] = {
      score: 0,
      claimedCodes: []
    };
  }

  if (!global.db.users[sender].claimedCodes) {
    global.db.users[sender].claimedCodes = [];
  }

  // 3. Cek Apakah Kode Sudah Pernah Diklaim oleh User Ini
  if (global.db.users[sender].claimedCodes.includes(formattedCode)) {
    return await sock.sendMessage(remoteJid, {
      text: `⚠️ Kode *${formattedCode}* sudah pernah kamu klaim sebelumnya!`
    }, { quoted: msg });
  }

  // 4. Proses Klaim & Penambahan Poin/Skor
  const rewardScore = 150; // Poin bonus yang diberikan
  global.db.users[sender].score += rewardScore;
  global.db.users[sender].claimedCodes.push(formattedCode);

  const successMessage = 
`🎉 *KLAIM SKOR TETRIS BERHASIL!*

✨ *Kode:* ${formattedCode}
🎁 *Bonus:* +${rewardScore} Score
🏆 *Total Score Kamu:* ${global.db.users[sender].score}`;

  await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: msg });
}

module.exports = {
  tetrisCommand,
  claimTetrisCommand
};
